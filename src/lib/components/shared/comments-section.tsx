"use client";

import React, { useState } from 'react';
import { Avatar, Button, Input } from "@heroui/react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReply, faTrash, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Comment } from '@/src/lib/types/types';
import { addComment, deleteComment, voteComment } from '@/src/lib/actions/comments';
import { useSession } from '@/src/lib/auth-client';
import { formatDistanceToNow } from 'date-fns';

interface CommentItemProps {
  comment: Comment;
  contentType: 'video' | 'picture' | 'quote';
  contentId: string;
  isReply?: boolean;
  session: { user: { id: string; role?: string; image?: string | null } } | null | undefined;
  mounted: boolean;
  onDelete: (id: string) => Promise<void>;
  onVote: (id: string, value: number, currentVote?: number) => Promise<void>;
  onReply: (contentId: string, parentId: string, content: string) => Promise<void>;
}

const CommentItem = ({ 
  comment, 
  contentType, 
  contentId, 
  isReply = false, 
  session,
  mounted,
  onDelete,
  onVote,
  onReply
}: CommentItemProps) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onReply(contentId, comment.id, replyContent);
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to add reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`group flex gap-4 p-4 rounded-xl transition duration-300 ${isReply ? 'ml-12 bg-white/5' : 'hover:bg-white/5'}`}>
      <Avatar src={comment.user.profilePicture || ""} size={isReply ? "sm" : "md"} />
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-start">
          <div className="flex gap-2 items-baseline">
            <span className="text-sm font-bold text-white">{comment.user.username}</span>
            <span className="text-xs text-white/30">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
          </div>
          {mounted && (session?.user.id === comment.user.id || session?.user.role === 'admin') && (
            <button 
              onClick={() => onDelete(comment.id)}
              className="opacity-0 group-hover:opacity-100 transition text-white/30 hover:text-danger"
            >
              <FontAwesomeIcon icon={faTrash} size="sm" />
            </button>
          )}
        </div>
        <p className="text-sm text-white/70">{comment.content}</p>
        
        <div className="flex gap-4 pt-2 items-center">
          <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-1">
            <button 
              onClick={() => onVote(comment.id, 1, comment.userVote)}
              className={`text-xs transition hover:scale-110 ${comment.userVote === 1 ? 'text-primary' : 'text-white/40 hover:text-white'}`}
            >
              <FontAwesomeIcon icon={faChevronUp} />
            </button>
            <span className="text-xs font-bold text-white/60 min-w-[12px] text-center">
              {comment.upvotes - comment.downvotes}
            </span>
            <button 
              onClick={() => onVote(comment.id, -1, comment.userVote)}
              className={`text-xs transition hover:scale-110 ${comment.userVote === -1 ? 'text-danger' : 'text-white/40 hover:text-white'}`}
            >
              <FontAwesomeIcon icon={faChevronDown} />
            </button>
          </div>

          {!isReply && mounted && session && (
            <button 
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs text-white/40 hover:text-white font-bold flex items-center gap-1"
            >
              <FontAwesomeIcon icon={faReply} /> Reply
            </button>
          )}
        </div>

        {replyingTo === comment.id && (
          <div className="mt-4 flex gap-4 animate-in fade-in slide-in-from-top-2">
            <Avatar src={session?.user.image || ""} size="sm" />
            <div className="flex-1">
              <Input
                size="sm"
                variant="underlined"
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                classNames={{ input: "text-white", inputWrapper: "border-white/20" }}
              />
              <div className="flex justify-end mt-2 gap-2">
                <Button size="sm" variant="light" onClick={() => setReplyingTo(null)}>Cancel</Button>
                <Button 
                  size="sm" 
                  className="bg-white/10 text-white rounded-full font-bold"
                  isLoading={isSubmitting}
                  onClick={handleReplySubmit}
                >
                  Reply
                </Button>
              </div>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                isReply 
                contentType={contentType}
                contentId={contentId}
                session={session}
                mounted={mounted}
                onDelete={onDelete}
                onVote={onVote}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface CommentsSectionProps {
  contentType: 'video' | 'picture' | 'quote';
  contentId: string;
  initialComments: Comment[];
}

export const CommentsSection = ({ contentType, contentId, initialComments }: CommentsSectionProps) => {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddComment = async (id: string, parentId?: string, content?: string) => {
    const finalContent = content || newComment;
    if (!finalContent.trim() || isSubmitting) return;

    if (!parentId) setIsSubmitting(true);
    try {
      await addComment(contentType, contentId, finalContent, parentId);
      if (!parentId) setNewComment('');
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      if (!parentId) setIsSubmitting(false);
    }
  };

  const handleVote = async (commentId: string, value: number, currentVote?: number) => {
    if (!session) return;
    const newValue = currentVote === value ? 0 : value;
    try {
      await voteComment(commentId, newValue, contentType, contentId);
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteComment(commentId, contentType, contentId);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const renderCommentInput = () => {
    if (!mounted) {
      return (
        <div className="mb-8 p-4 bg-white/5 rounded-xl text-center border border-dashed border-white/10 animate-pulse">
          <p className="text-white/20 text-sm">Loading session...</p>
        </div>
      );
    }

    if (session) {
      return (
        <div className="mb-8 flex gap-4">
          <Avatar src={session.user.image || ""} />
          <div className="flex-1">
            <Input
              variant="underlined"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              classNames={{ input: "text-white", inputWrapper: "border-white/20" }}
            />
            <div className="flex justify-end mt-2">
              <Button 
                size="sm" 
                className="bg-white/10 text-white rounded-full font-bold hover:bg-white hover:text-black transition"
                isLoading={isSubmitting}
                onClick={() => handleAddComment(contentId)}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-8 p-4 bg-white/5 rounded-xl text-center border border-dashed border-white/10">
        <p className="text-white/40 text-sm">Please log in to leave a comment</p>
      </div>
    );
  };

  return (
    <div className="bg-[#121212]/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mt-8">
      <h3 className="text-xl font-bold text-white mb-6">
        Comments <span className="text-white/40 font-normal">({initialComments.length})</span>
      </h3>

      {renderCommentInput()}

      <div className="space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
        {initialComments.map((comment) => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            contentType={contentType}
            contentId={contentId}
            session={session}
            mounted={mounted}
            onDelete={handleDelete}
            onVote={handleVote}
            onReply={(cid, pid, cont) => handleAddComment(cid, pid, cont)}
          />
        ))}
        {initialComments.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-white/20 italic">No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
};
