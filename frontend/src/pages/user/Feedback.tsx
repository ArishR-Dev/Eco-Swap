import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { pickupService } from '@/services/pickupService';
import { userService } from '@/services/userService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Star,
  Send,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Calendar,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FeedbackItem {
  id: string;
  pickupId: string;
  rating: number;
  comment: string;
  createdAt: string;
  collectorName: string;
}

export default function Feedback() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedPickup, setSelectedPickup] = useState('');
  const [completedPickups, setCompletedPickups] = useState<any[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load completed pickups for dropdown
      const allPickups = await pickupService.getMyPickups();
      const completed = allPickups.filter(
        (p: any) => p.status === 'RECYCLED' || p.status === 'COLLECTED'
      );
      setCompletedPickups(completed);

      // Load feedback history
      const feedback = await userService.getUserFeedback();
      const mapped = feedback.map((f: any) => ({
        id: f.id || '',
        pickupId: f.pickupId || '',
        rating: Number(f.rating) || 0,
        comment: f.comment || '',
        createdAt: f.createdAt || new Date().toISOString(),
        collectorName: f.collectorName || 'Unknown',
      }));
      setFeedbackHistory(mapped);
    } catch (error: any) {
      console.error('[FEEDBACK] Failed to load:', error);
      const msg = String(error?.message || error);
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        logout();
        navigate('/login');
        return;
      }
      setCompletedPickups([]);
      setFeedbackHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedPickup) {
      toast({
        title: "Error",
        description: "Please select a pickup to review.",
        variant: "destructive",
      });
      return;
    }
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await pickupService.addFeedback(selectedPickup, rating, comment);
      
      // Reload feedback history
      const feedback = await userService.getUserFeedback();
      const mapped = feedback.map((f: any) => ({
        id: f.id || '',
        pickupId: f.pickupId || '',
        rating: Number(f.rating) || 0,
        comment: f.comment || '',
        createdAt: f.createdAt || new Date().toISOString(),
        collectorName: f.collectorName || 'Unknown',
      }));
      setFeedbackHistory(mapped);

      setRating(0);
      setComment('');
      setSelectedPickup('');

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! It helps us improve our service.",
      });
    } catch (error: any) {
      console.error('[FEEDBACK] Submit failed:', error);
      const msg = String(error?.message || error);
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        logout();
        navigate('/login');
        return;
      }
      toast({
        title: "Error",
        description: msg.includes('completed') 
          ? "Feedback can only be submitted for completed pickups."
          : "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (value: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          >
            <Star
              className={`h-6 w-6 ${
                star <= (interactive ? (hoverRating || rating) : value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const averageRating = feedbackHistory.length > 0
    ? (feedbackHistory.reduce((sum, f) => sum + f.rating, 0) / feedbackHistory.length).toFixed(1)
    : '0';

  const pickupsAlreadyReviewed = new Set(feedbackHistory.map(f => f.pickupId));
  const availablePickups = completedPickups.filter(
    (p: any) => !pickupsAlreadyReviewed.has(p.id)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feedback</h1>
        <p className="text-muted-foreground">Rate your pickup experience and help us improve</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageRating}</p>
                <p className="text-sm text-muted-foreground">Avg. Rating Given</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{feedbackHistory.length}</p>
                <p className="text-sm text-muted-foreground">Reviews Given</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ThumbsUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {feedbackHistory.filter(f => f.rating >= 4).length}
                </p>
                <p className="text-sm text-muted-foreground">Positive Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Rate Your Experience
          </CardTitle>
          <CardDescription>Share your feedback about a recent pickup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select Pickup</Label>
            <Select value={selectedPickup} onValueChange={setSelectedPickup}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a completed pickup to review" />
              </SelectTrigger>
              <SelectContent>
                {availablePickups.length === 0 ? (
                  <SelectItem value="none" disabled>No completed pickups available</SelectItem>
                ) : (
                  availablePickups.map((pickup) => (
                    <SelectItem key={pickup.id} value={pickup.id}>
                      {pickup.scheduledDate || pickup.scheduled_date || 'Date N/A'} - {(pickup.items || []).map((i: any) => i?.category || 'Unknown').join(', ')}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            {renderStars(rating, true)}
            <p className="text-sm text-muted-foreground">
              {rating === 0 && 'Click to rate'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Feedback (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleSubmitFeedback} className="gap-2" disabled={submitting}>
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </CardContent>
      </Card>

      {/* Feedback History */}
      <Card>
        <CardHeader>
          <CardTitle>Your Feedback History</CardTitle>
          <CardDescription>Reviews you've submitted</CardDescription>
        </CardHeader>
        <CardContent>
          {feedbackHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No Feedback Yet</h3>
              <p className="text-muted-foreground">
                Complete a pickup to share your experience!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackHistory.map((feedback) => (
                <div key={feedback.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {renderStars(feedback.rating)}
                        <Badge variant="secondary">{feedback.collectorName}</Badge>
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-muted-foreground">{feedback.comment}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
