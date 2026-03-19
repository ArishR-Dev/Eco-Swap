import { useState } from 'react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { TimeSlot } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, AlertTriangle, Sun, Sunset } from 'lucide-react';

interface DateTimeStepProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedTimeSlot: string;
  onTimeSlotChange: (slotId: string) => void;
  timeSlots: TimeSlot[];
  priority: 'NORMAL' | 'URGENT';
  onPriorityChange: (priority: 'NORMAL' | 'URGENT') => void;
}

const slotIcons: Record<string, React.ReactNode> = {
  'slot-1': <Sun className="w-4 h-4" />,
  'slot-2': <Sun className="w-4 h-4" />,
  'slot-3': <Sunset className="w-4 h-4" />,
  'slot-4': <Sunset className="w-4 h-4" />,
};

export default function DateTimeStep({
  selectedDate,
  onDateChange,
  selectedTimeSlot,
  onTimeSlotChange,
  timeSlots,
  priority,
  onPriorityChange,
}: DateTimeStepProps) {
  const today = startOfDay(new Date());
  const minDate = addDays(today, 1); // Minimum is tomorrow
  const maxDate = addDays(today, 30); // Maximum is 30 days from now

  const disabledDays = (date: Date) => {
    return isBefore(date, minDate) || isBefore(maxDate, date);
  };

  return (
    <div className="space-y-6">
      {/* Priority Selection */}
      <div className="space-y-3">
        <Label>Pickup Priority</Label>
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className={cn(
              "cursor-pointer transition-all",
              priority === 'NORMAL' 
                ? "border-primary bg-primary/5" 
                : "hover:border-muted-foreground/50"
            )}
            onClick={() => onPriorityChange('NORMAL')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium">Normal</h4>
              <p className="text-xs text-muted-foreground">Standard scheduling</p>
            </CardContent>
          </Card>

          <Card 
            className={cn(
              "cursor-pointer transition-all",
              priority === 'URGENT' 
                ? "border-orange-500 bg-orange-500/5" 
                : "hover:border-muted-foreground/50"
            )}
            onClick={() => onPriorityChange('URGENT')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <h4 className="font-medium">Urgent</h4>
              <p className="text-xs text-muted-foreground">Priority processing</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Date Selection */}
      <div className="space-y-3">
        <Label>Select Pickup Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-12",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "EEEE, MMMM do, yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              disabled={disabledDays}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Pickups can be scheduled between tomorrow and 30 days from now.
        </p>
      </div>

      {/* Time Slot Selection */}
      <div className="space-y-3">
        <Label>Select Time Slot</Label>
        <div className="grid grid-cols-2 gap-3">
          {timeSlots.map((slot) => (
            <Card
              key={slot.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedTimeSlot === slot.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/50"
              )}
              onClick={() => onTimeSlotChange(slot.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    selectedTimeSlot === slot.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    {slotIcons[slot.id] || <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-medium">{slot.label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Summary */}
      {selectedDate && selectedTimeSlot && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h4 className="font-medium">Scheduled Pickup</h4>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, "EEEE, MMMM do, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {timeSlots.find(s => s.id === selectedTimeSlot)?.startTime} - {timeSlots.find(s => s.id === selectedTimeSlot)?.endTime}
                </p>
              </div>
              {priority === 'URGENT' && (
                <Badge variant="outline" className="ml-auto border-orange-500 text-orange-500">
                  URGENT
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
