import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comments: string, serviceQuality: number, foodQuality: number, ambiance: number) => Promise<void>;
  onSkip: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, onClose, onSubmit, onSkip }) => {
  const [rating, setRating] = useState<number>(0);
  const [comments, setComments] = useState<string>('');
  const [serviceQuality, setServiceQuality] = useState<number>(0);
  const [foodQuality, setFoodQuality] = useState<number>(0);
  const [ambiance, setAmbiance] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const handleRatingChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    setter(value);
  };

  const handleSubmit = async () => {
    if (
      rating < 1 || rating > 5 ||
      serviceQuality < 1 || serviceQuality > 5 ||
      foodQuality < 1 || foodQuality > 5 ||
      ambiance < 1 || ambiance > 5
    ) {
      toast.error('Please provide a rating between 1 and 5 for all categories.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(rating, comments, serviceQuality, foodQuality, ambiance);
      setRating(0);
      setComments('');
      setServiceQuality(0);
      setFoodQuality(0);
      setAmbiance(0);
      onClose();
      toast.success('Feedback submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Feedback</DialogTitle>
      <DialogContent>
        <div className="space-y-6">
          <div>
            <Label>Overall Rating</Label>
            <div className="flex space-x-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(setRating, star)}
                  className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-400'}`}
                  aria-label={`${star} star`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Service Quality</Label>
            <div className="flex space-x-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(setServiceQuality, star)}
                  className={`text-2xl ${star <= serviceQuality ? 'text-yellow-400' : 'text-gray-400'}`}
                  aria-label={`${star} star`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Food Quality</Label>
            <div className="flex space-x-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(setFoodQuality, star)}
                  className={`text-2xl ${star <= foodQuality ? 'text-yellow-400' : 'text-gray-400'}`}
                  aria-label={`${star} star`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Ambiance</Label>
            <div className="flex space-x-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(setAmbiance, star)}
                  className={`text-2xl ${star <= ambiance ? 'text-yellow-400' : 'text-gray-400'}`}
                  aria-label={`${star} star`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Write your feedback here..."
              rows={4}
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onSkip} disabled={submitting} variant="outline">Skip</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackModal;
