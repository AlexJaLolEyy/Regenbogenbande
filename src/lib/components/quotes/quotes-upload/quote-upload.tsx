"use client";

import { useState, useEffect } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { 
  Avatar, 
  BreadcrumbItem, 
  Breadcrumbs, 
  Button, 
  Card, 
  Input, 
  Select, 
  SelectedItems, 
  SelectItem,
  DateInput
} from "@heroui/react";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faMessage } from "@fortawesome/free-regular-svg-icons";
import { getAllUsers } from "@/src/app/current-storage/storage";
import type { User } from "../../../types/types";
import { createQuote } from "@/src/app/(content)/quotes/(detail)/upload/actions";

interface Message {
  userId: string;
  message: string;
}

interface QuoteFormData {
  uploadedBy: User | string;
  uploadedAt: Date;
  createdAt: Date;
  messages: Message[];
}

export default function QuoteUpload() {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { userId: "", message: "" }
  ]);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<QuoteFormData>({
    defaultValues: {
      uploadedAt: new Date(),
      createdAt: new Date(),
      messages: [],
    }
  });

  useEffect(() => {
    getAllUsers().then((users) => {
      setUsers(users);
    });
  }, []);

  const addMessage = () => {
    setMessages([...messages, { userId: "", message: "" }]);
  };

  const removeMessage = (index: number) => {
    if (messages.length > 1) {
      setMessages(messages.filter((_, i) => i !== index));
    }
  };

  const updateMessage = (index: number, field: keyof Message, value: string) => {
    const updated = [...messages];
    updated[index] = { ...updated[index], [field]: value };
    setMessages(updated);
  };

  const onSubmit: SubmitHandler<QuoteFormData> = async (data) => {
    // Filter out empty messages
    const validMessages = messages.filter(msg => msg.userId && msg.message.trim());
    
    if (validMessages.length === 0) {
      alert("Please add at least one message");
      return;
    }

    try {
      const quoteData = {
        ...data,
        messages: validMessages,
      };
      
      await createQuote(quoteData);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'digest' in error && 
          typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
        return;
      }
      console.error('Error uploading quote:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/quotes">Quotes</BreadcrumbItem>
        <BreadcrumbItem>Upload</BreadcrumbItem>
      </Breadcrumbs>

      <div className="flex items-center gap-3">
        <FontAwesomeIcon icon={faMessage} className="text-2xl text-primary" />
        <h1 className="text-3xl font-bold">Upload Quote</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <div className="space-y-6">
            {/* Uploaded By */}
            <div>
              <Controller
                name="uploadedBy"
                control={control}
                rules={{ required: "Please select a user" }}
                render={({ field }) => (
                  <Select
                    isRequired
                    label="Uploaded By"
                    placeholder="Select a user"
                    variant="bordered"
                    labelPlacement="inside"
                    isInvalid={!!errors.uploadedBy}
                    errorMessage={errors.uploadedBy?.message}
                    selectedKeys={field.value ? [typeof field.value === 'string' ? field.value : field.value.id.toString()] : []}
                    onSelectionChange={(keys) => {
                      const selectedId = Array.from(keys)[0] as string;
                      const selectedUser = users.find(u => u.id.toString() === selectedId);
                      field.onChange(selectedUser);
                    }}
                    renderValue={(items: SelectedItems<User>) => {
                      return items.map((item) => (
                        item.data ? (
                          <div key={item.key} className="flex items-center gap-2">
                            <Avatar
                              alt={item.data?.username}
                              className="flex-shrink-0 w-6 h-6"
                              size="sm"
                              src={item.data?.profilepicture}
                            />
                            <span className="text-sm">{item.data?.username}</span>
                          </div>
                        ) : null
                      ));
                    }}
                  >
                    {users.map((user) => (
                      <SelectItem key={user.id} textValue={user.username}>
                        <div className="flex gap-2 items-center">
                          <Avatar alt={user.username} className="flex-shrink-0" size="sm" src={user.profilepicture} />
                          <span className="text-small">{user.username}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
            </div>

            {/* Created At */}
            <div>
              <Controller
                name="createdAt"
                control={control}
                rules={{ required: true }}
                defaultValue={new Date()}
                render={({ field }) => (
                  <DateInput
                    isRequired
                    label="Created At"
                    variant="bordered"
                    value={field.value ? fromDate(field.value, getLocalTimeZone()) : null}
                    onChange={field.onChange}
                    isInvalid={!!errors.createdAt}
                    errorMessage="Please select a date"
                  />
                )}
              />
            </div>
          </div>
        </Card>

        {/* Messages */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Messages</h2>
              <Button
                type="button"
                size="sm"
                color="primary"
                variant="flat"
                startContent={<FontAwesomeIcon icon={faPlus} />}
                onPress={addMessage}
              >
                Add Message
              </Button>
            </div>

            <div className="space-y-4">
              {messages.map((message, index) => (
                <Card key={index} className="p-4 bg-default-50 dark:bg-default-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <Select
                        label={`User ${index + 1}`}
                        placeholder="Select user"
                        variant="bordered"
                        selectedKeys={message.userId ? [message.userId] : []}
                        onSelectionChange={(keys) => {
                          const selectedId = Array.from(keys)[0] as string;
                          updateMessage(index, 'userId', selectedId);
                        }}
                        renderValue={(items: SelectedItems<User>) => {
                          return items.map((item) => (
                            item.data ? (
                              <div key={item.key} className="flex items-center gap-2">
                                <Avatar
                                  alt={item.data?.username}
                                  className="flex-shrink-0 w-6 h-6"
                                  size="sm"
                                  src={item.data?.profilepicture}
                                />
                                <span className="text-sm">{item.data?.username}</span>
                              </div>
                            ) : null
                          ));
                        }}
                      >
                        {users.map((user) => (
                          <SelectItem key={user.id.toString()} textValue={user.username}>
                            <div className="flex gap-2 items-center">
                              <Avatar alt={user.username} className="flex-shrink-0" size="sm" src={user.profilepicture} />
                              <span className="text-small">{user.username}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                      <Input
                        label={`Message ${index + 1}`}
                        placeholder="Enter message"
                        variant="bordered"
                        value={message.message}
                        onChange={(e) => updateMessage(index, 'message', e.target.value)}
                        isRequired
                      />
                    </div>
                    {messages.length > 1 && (
                      <Button
                        type="button"
                        isIconOnly
                        color="danger"
                        variant="light"
                        onPress={() => removeMessage(index)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button 
            type="submit" 
            color="primary" 
            size="lg"
            startContent={<FontAwesomeIcon icon={faMessage} />}
            className="px-8"
          >
            Upload Quote
          </Button>
        </div>
      </form>
    </div>
  );
}
