import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { pickupService } from '@/services/pickupService';
import { EWasteItem, EWasteCategory } from '@/types';
import { ewasteCategories, timeSlots } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, Package, MapPin, Calendar, ClipboardCheck } from 'lucide-react';
import ItemSelectionStep from '@/components/user/pickup-wizard/ItemSelectionStep';
import AddressStep from '@/components/user/pickup-wizard/AddressStep';
import DateTimeStep from '@/components/user/pickup-wizard/DateTimeStep';
import ReviewStep from '@/components/user/pickup-wizard/ReviewStep';
import ConfirmationStep from '@/components/user/pickup-wizard/ConfirmationStep';

const STEPS = [
  { id: 1, title: 'Select Items', icon: Package, description: 'Choose e-waste items' },
  { id: 2, title: 'Address', icon: MapPin, description: 'Pickup location' },
  { id: 3, title: 'Schedule', icon: Calendar, description: 'Date & time' },
  { id: 4, title: 'Review', icon: ClipboardCheck, description: 'Confirm details' },
];

export default function NewPickupRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPickupId, setSubmittedPickupId] = useState<string | null>(null);

  // Form data
  const [selectedItems, setSelectedItems] = useState<EWasteItem[]>([]);
  const [address, setAddress] = useState(user?.address || '');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');

  const progress = (currentStep / STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedItems.length > 0;
      case 2:
        return address.trim().length > 10;
      case 3:
        return scheduledDate && selectedTimeSlot;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !scheduledDate || !selectedTimeSlot) return;

    setIsSubmitting(true);
    try {
      const timeSlot = timeSlots.find(t => t.id === selectedTimeSlot);
      
      // Calculate total weight from items
      const totalWeight = selectedItems.reduce((sum, item) => {
        const itemWeight = Number(item.estimatedWeight || item.weight || 0) || 0;
        const quantity = Number(item.quantity || 1) || 1;
        return sum + (itemWeight * quantity);
      }, 0);

      // Map form fields to backend expected format
      const payload = {
        address: address.trim(),
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        time_slot: timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : selectedTimeSlot,
        priority: priority,
        weight: totalWeight, // Send weight field
        total_weight: totalWeight, // Also send total_weight for compatibility
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        items: selectedItems.map(item => ({
          category: item.category,
          quantity: Number(item.quantity || 1) || 1,
          estimated_weight: Number(item.estimatedWeight || item.weight || 0) || 0,
          description: item.description || undefined,
        })),
        notes: notes.trim() || undefined,
      };

      const pickup = await pickupService.createPickup(payload);

      setSubmittedPickupId(pickup.id);
      setCurrentStep(5); // Move to confirmation

      toast({
        title: 'Pickup Request Submitted!',
        description: `Your request ID: ${pickup.id}`,
      });
    } catch (error: any) {
      console.error('[NEW PICKUP] Submit failed:', error);
      const msg = String(error?.message || error);
      toast({
        title: 'Error',
        description: msg.includes('401') || msg.toLowerCase().includes('unauthorized')
          ? 'Session expired. Please login again.'
          : 'Failed to submit pickup request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = (category: EWasteCategory, quantity: number, weight: number, description?: string) => {
    const newItem: EWasteItem = {
      id: `temp-${Date.now()}`,
      category,
      quantity,
      estimatedWeight: weight,
      description,
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, updates: Partial<EWasteItem>) => {
    setSelectedItems(selectedItems.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  // Show confirmation step
  if (currentStep === 5 && submittedPickupId) {
    return (
      <div className="container max-w-3xl py-8">
        <ConfirmationStep 
          pickupId={submittedPickupId}
          onViewPickup={() => navigate(`/user/track/${submittedPickupId}`)}
          onNewRequest={() => {
            setCurrentStep(1);
            setSelectedItems([]);
            setScheduledDate(undefined);
            setSelectedTimeSlot('');
            setNotes('');
            setPriority('NORMAL');
            setSubmittedPickupId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Schedule E-Waste Pickup</h1>
        <p className="text-muted-foreground">
          Complete the steps below to schedule a pickup for your electronic waste.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step) => (
            <div 
              key={step.id} 
              className={`flex items-center gap-2 text-sm ${
                currentStep >= step.id ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep > step.id 
                  ? 'bg-primary text-primary-foreground' 
                  : currentStep === step.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </div>
              <span className="hidden sm:inline">{step.title}</span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {STEPS[currentStep - 1]?.icon && (
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {(() => {
                  const StepIcon = STEPS[currentStep - 1].icon;
                  return <StepIcon className="w-4 h-4 text-primary" />;
                })()}
              </span>
            )}
            {STEPS[currentStep - 1]?.title}
          </CardTitle>
          <CardDescription>{STEPS[currentStep - 1]?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <ItemSelectionStep
              selectedItems={selectedItems}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onUpdateItem={handleUpdateItem}
              categories={ewasteCategories}
            />
          )}
          
          {currentStep === 2 && (
            <AddressStep
              address={address}
              onAddressChange={setAddress}
              userDefaultAddress={user?.address}
            latitude={latitude ?? undefined}
            longitude={longitude ?? undefined}
            onLocationChange={(coords) => {
              if (!coords) {
                setLatitude(null);
                setLongitude(null);
              } else {
                setLatitude(coords.latitude);
                setLongitude(coords.longitude);
              }
            }}
            />
          )}
          
          {currentStep === 3 && (
            <DateTimeStep
              selectedDate={scheduledDate}
              onDateChange={setScheduledDate}
              selectedTimeSlot={selectedTimeSlot}
              onTimeSlotChange={setSelectedTimeSlot}
              timeSlots={timeSlots}
              priority={priority}
              onPriorityChange={setPriority}
            />
          )}
          
          {currentStep === 4 && (
            <ReviewStep
              items={selectedItems}
              address={address}
              scheduledDate={scheduledDate}
              selectedTimeSlot={selectedTimeSlot}
              timeSlots={timeSlots}
              notes={notes}
              onNotesChange={setNotes}
              priority={priority}
              categories={ewasteCategories}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {currentStep < STEPS.length ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
            <Check className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
