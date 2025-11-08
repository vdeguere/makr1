import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  paymentFilter: string;
  setPaymentFilter: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: (value: { from: Date | undefined; to: Date | undefined }) => void;
  onClearFilters: () => void;
}

export function OrderFilters({
  statusFilter,
  setStatusFilter,
  paymentFilter,
  setPaymentFilter,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  onClearFilters,
}: OrderFiltersProps) {
  const hasActiveFilters = 
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    searchQuery !== '' ||
    dateRange.from !== undefined ||
    dateRange.to !== undefined;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Order Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment">Payment Status</Label>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger id="payment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Order ID, patient, tracking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal flex-1',
                    !dateRange.from && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'PP') : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal flex-1',
                    !dateRange.to && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, 'PP') : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
