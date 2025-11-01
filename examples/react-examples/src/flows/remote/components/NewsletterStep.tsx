import { useFlow } from "@useflow/react";
import { Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RemoteOnboardingContext } from "../types";

export function NewsletterStep() {
  const { next, context } = useFlow<RemoteOnboardingContext>();
  const [subscribeUpdates, setSubscribeUpdates] = useState(true);
  const [subscribeTips, setSubscribeTips] = useState(false);
  const [subscribeEvents, setSubscribeEvents] = useState(false);

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-indigo-600" />
        </div>
        <CardTitle>Stay in the Loop</CardTitle>
        <CardDescription>
          Subscribe to our newsletter for updates, tips, and exclusive content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="newsletter-email">Email Address</Label>
          <Input
            id="newsletter-email"
            type="email"
            placeholder="your@email.com"
            value={context.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Using email from your account
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">
            What would you like to receive?
          </Label>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="updates"
              checked={subscribeUpdates}
              onCheckedChange={(checked) =>
                setSubscribeUpdates(checked === true)
              }
            />
            <Label htmlFor="updates" className="text-sm">
              Product updates and announcements
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tips"
              checked={subscribeTips}
              onCheckedChange={(checked) => setSubscribeTips(checked === true)}
            />
            <Label htmlFor="tips" className="text-sm">
              Weekly tips and best practices
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="events"
              checked={subscribeEvents}
              onCheckedChange={(checked) =>
                setSubscribeEvents(checked === true)
              }
            />
            <Label htmlFor="events" className="text-sm">
              Event invitations and webinars
            </Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => next()} className="flex-1">
            Skip Newsletter
          </Button>
          <Button
            onClick={() => next()}
            className="flex-1"
            disabled={
              !context.email &&
              (subscribeUpdates || subscribeTips || subscribeEvents)
            }
          >
            Subscribe & Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
