"use client"

import { Quote } from "../../../types/types"
import { faEye, faStar, faClock, faUser } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Avatar, AvatarGroup, Card, Chip } from "@heroui/react";
import { BreadcrumbItem, Breadcrumbs } from "@heroui/react";

export default function QuoteView({ quote }: { quote: Quote }) {
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const uploadDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const calculateAverageRating = (ratings: { value: number }[]) => {
    if (!ratings || ratings.length === 0) return '0.0';
    const sum = ratings.reduce((acc, rating) => acc + rating.value, 0);
    return (sum / ratings.length).toFixed(1);
  };

  // Get unique participants for avatar group
  const uniqueParticipants = Array.from(
    new Map(quote.fullQuote.map(msg => [msg.user.id, msg.user])).values()
  );

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto pb-12">
      <Breadcrumbs className="mb-6">
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/quotes">Quotes</BreadcrumbItem>
        <BreadcrumbItem>Quote #{quote.id}</BreadcrumbItem>
      </Breadcrumbs>

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Quote #{quote.id}</h1>
            <div className="flex items-center gap-4 text-default-500">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} />
                <span>Uploaded {formatTimeAgo(quote.uploadedAt)}</span>
              </div>
              {quote.createdAt && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} />
                  <span>Created {new Date(quote.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          {quote.fullQuote.map((singleQuote, index) => (
            <div 
              key={`${singleQuote.user.id}-${index}`} 
              className="bg-default-100 dark:bg-default-200 rounded-lg p-4 border border-default-200 dark:border-default-300 hover:bg-default-200 dark:hover:bg-default-300 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Avatar 
                  src={singleQuote.user.profilepicture || undefined}
                  name={singleQuote.user.username}
                  size="md"
                  className="flex-shrink-0"
                />
                <div className="flex items-center gap-2 flex-1">
                  <h3 className="font-semibold text-lg text-default-900 dark:text-default-100">{singleQuote.user.username}</h3>
                  {index === 0 && (
                    <Chip size="sm" color="primary" variant="flat">First Message</Chip>
                  )}
                </div>
              </div>
              <p className="text-default-900 dark:text-default-100 whitespace-pre-wrap break-words pl-14">
                {singleQuote.msg}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Participants */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FontAwesomeIcon icon={faUser} className="text-xl" />
              <h3 className="text-xl font-semibold">Participants</h3>
            </div>
            <AvatarGroup max={5} size="md">
              {uniqueParticipants.map((participant) => (
                <Avatar
                  key={participant.id}
                  src={participant.profilepicture || undefined}
                  name={participant.username}
                />
              ))}
            </AvatarGroup>
            <p className="text-sm text-default-500">
              {uniqueParticipants.length} participant{uniqueParticipants.length !== 1 ? 's' : ''}
            </p>
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Statistics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faEye} />
                  <span>Views</span>
                </div>
                <span className="font-semibold">{quote.metadata.views}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
                  <span>Rating</span>
                </div>
                <span className="font-semibold">{calculateAverageRating(quote.metadata.rating)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Messages</span>
                <span className="font-semibold">{quote.fullQuote.length}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Uploaded By */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Uploaded By</h3>
            <div className="flex items-center gap-3">
              <Avatar 
                src={quote.uploadedBy.profilepicture || undefined}
                name={quote.uploadedBy.username}
                size="lg"
              />
              <div>
                <p className="font-semibold text-lg">{quote.uploadedBy.username}</p>
                <p className="text-sm text-default-500">User ID: {quote.uploadedBy.id}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
