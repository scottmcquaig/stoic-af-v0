import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Copy, Check, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const testCards = [
  {
    number: '4242 4242 4242 4242',
    brand: 'Visa',
    description: 'Successful payment',
    cvc: 'Any 3 digits',
    exp: 'Any future date'
  },
  {
    number: '4000 0000 0000 0002',
    brand: 'Visa',
    description: 'Card declined',
    cvc: 'Any 3 digits',
    exp: 'Any future date'
  },
  {
    number: '4000 0000 0000 9995',
    brand: 'Visa',
    description: 'Insufficient funds',
    cvc: 'Any 3 digits',
    exp: 'Any future date'
  },
  {
    number: '5555 5555 5555 4444',
    brand: 'Mastercard',
    description: 'Successful payment',
    cvc: 'Any 3 digits',
    exp: 'Any future date'
  }
];

interface TestCardHelperProps {
  className?: string;
}

export default function TestCardHelper({ className }: TestCardHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCard, setCopiedCard] = useState<string | null>(null);

  const copyToClipboard = async (text: string, cardNumber: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCard(cardNumber);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedCard(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Test Card Numbers
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-auto"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Alert className="mb-4">
          <AlertDescription className="text-sm">
            You're in <strong>test mode</strong>. Only use these test card numbers - real cards will be declined.
          </AlertDescription>
        </Alert>

        {/* Quick copy for most common card */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-3">
          <div>
            <div className="font-mono text-sm font-medium">4242 4242 4242 4242</div>
            <div className="text-xs text-muted-foreground">Visa • Any future date • Any CVC</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard('4242424242424242', '4242 4242 4242 4242')}
            className="flex items-center gap-2"
          >
            {copiedCard === '4242 4242 4242 4242' ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            Copy
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">All Test Cards:</div>
            {testCards.map((card, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded">
                <div>
                  <div className="font-mono text-sm">{card.number}</div>
                  <div className="text-xs text-muted-foreground">
                    {card.brand} • {card.description}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(card.number.replace(/\s/g, ''), card.number)}
                  className="p-1 h-auto"
                >
                  {copiedCard === card.number ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
            
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                <strong>Expiry:</strong> Any future month/year (e.g., 12/28)<br />
                <strong>CVC:</strong> Any 3 digits (e.g., 123)<br />
                <strong>ZIP:</strong> Any 5 digits (e.g., 12345)
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}