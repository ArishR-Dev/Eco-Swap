import { useState } from 'react';
import { EWasteItem, EWasteCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Package, Monitor, Laptop, Smartphone, Tablet, Tv, Printer, Battery, Cable, Cpu, AirVent } from 'lucide-react';

interface ItemSelectionStepProps {
  selectedItems: EWasteItem[];
  onAddItem: (category: EWasteCategory, quantity: number, weight: number, description?: string) => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, updates: Partial<EWasteItem>) => void;
  categories: { category: EWasteCategory; label: string; icon: string; avgWeight: number }[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Tv,
  Printer,
  Battery,
  Cable,
  Cpu,
  AirVent,
  Package,
};

export default function ItemSelectionStep({
  selectedItems,
  onAddItem,
  onRemoveItem,
  categories,
}: ItemSelectionStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EWasteCategory | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState<number>(0);
  const [description, setDescription] = useState('');

  const handleCategoryChange = (value: EWasteCategory) => {
    setSelectedCategory(value);
    const category = categories.find(c => c.category === value);
    if (category) {
      setWeight(category.avgWeight);
    }
  };

  const handleAddItem = () => {
    if (!selectedCategory) return;
    
    onAddItem(
      selectedCategory,
      quantity,
      weight * quantity,
      description || undefined
    );

    // Reset form
    setSelectedCategory('');
    setQuantity(1);
    setWeight(0);
    setDescription('');
    setIsDialogOpen(false);
  };

  const totalWeight = selectedItems.reduce((sum, item) => sum + item.estimatedWeight, 0);
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || Package;
  };

  const getCategoryInfo = (category: EWasteCategory) => {
    return categories.find(c => c.category === category);
  };

  return (
    <div className="space-y-6">
      {/* Add Item Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add E-Waste Item
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add E-Waste Item</DialogTitle>
            <DialogDescription>
              Select the type of electronic waste you want to dispose of.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Item Category</Label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => {
                    const IconComponent = getIconComponent(cat.icon);
                    return (
                      <SelectItem key={cat.category} value={cat.category}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Est. Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="e.g., Old Dell laptop, 5 years old, not working"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={!selectedCategory}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Selected Items List */}
      {selectedItems.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Selected Items</h4>
          {selectedItems.map((item, index) => {
            const catInfo = getCategoryInfo(item.category);
            const IconComponent = catInfo ? getIconComponent(catInfo.icon) : Package;
            
            return (
              <Card key={index} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h5 className="font-medium">{catInfo?.label || item.category}</h5>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} • {item.estimatedWeight} kg
                        </p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={() => onRemoveItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold text-primary">{totalItems}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Est. Total Weight</p>
                  <p className="text-2xl font-bold text-primary">{totalWeight.toFixed(1)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="font-medium text-foreground mb-1">No items added yet</h4>
          <p className="text-sm text-muted-foreground">
            Click the button above to add e-waste items for pickup
          </p>
        </div>
      )}

      {/* Quick Add Grid */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Quick Add</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {categories.slice(0, 10).map((cat) => {
            const IconComponent = getIconComponent(cat.icon);
            return (
              <Button
                key={cat.category}
                variant="outline"
                size="sm"
                className="flex-col h-auto py-3 hover:bg-primary/5 hover:border-primary"
                onClick={() => {
                  handleCategoryChange(cat.category);
                  setIsDialogOpen(true);
                }}
              >
                <IconComponent className="w-5 h-5 mb-1" />
                <span className="text-xs text-center">{cat.label.split(' ')[0]}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
