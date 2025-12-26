import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";

// Initialize EmailJS with your public key
// Get this from https://dashboard.emailjs.com/admin/account
emailjs.init(process.env.BUN_PUBLIC_EMAIL_JS_PUBLIC_KEY as string);
const COOLDOWN_DURATION = 60; // 60 seconds

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isOnCooldown, setIsOnCooldown] = useState(false);

  // Check for existing cooldown on mount
  useEffect(() => {
    const lastSubmitTime = localStorage.getItem('lastContactFormSubmit');
    if (lastSubmitTime) {
      const elapsed = Date.now() - parseInt(lastSubmitTime);
      const remaining = COOLDOWN_DURATION * 1000 - elapsed;
      
      if (remaining > 0) {
        setIsOnCooldown(true);
        setCooldownRemaining(Math.ceil(remaining / 1000));
      } else {
        localStorage.removeItem('lastContactFormSubmit');
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isOnCooldown || cooldownRemaining <= 0) return;

    const timer = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1) {
          setIsOnCooldown(false);
          localStorage.removeItem('lastContactFormSubmit');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOnCooldown, cooldownRemaining]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limit
    if (isOnCooldown) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Send email using EmailJS
      const response = await emailjs.send(
        process.env.BUN_PUBLIC_EMAIL_JS_SERVICE_ID as string,
        process.env.BUN_PUBLIC_EMAIL_JS_TEMPLATE_ID as string,
        {
          to_email: "eddiewwu@gmail.com",
          name: formData.name,
          email: formData.email,
          message: formData.message,
          time: new Date().toLocaleString()
        }
      );

      if (response.status === 200) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
        
        // Set cooldown
        localStorage.setItem('lastContactFormSubmit', Date.now().toString());
        setIsOnCooldown(true);
        setCooldownRemaining(COOLDOWN_DURATION);
        
        // Reset success message after 5 seconds
        setTimeout(() => setSubmitStatus('idle'), 5000);
      }
    } catch (error) {
      console.error('Email send failed:', error);
      setSubmitStatus('error');
      // Reset error message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cooldownPercent = ((COOLDOWN_DURATION - cooldownRemaining) / COOLDOWN_DURATION) * 100;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="gap-2">
        <CardTitle className="text-3xl font-bold">Contact Me</CardTitle>
        <CardDescription>Send me an email and I'll get back to you soon</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitStatus === 'success' && (
            <div className="p-4 bg-green-100 text-green-700 rounded-md">
              Email sent successfully! 🎉
            </div>
          )}
          {submitStatus === 'error' && isOnCooldown && (
            <div className="p-4 bg-yellow-100 text-yellow-700 rounded-md">
              Please wait {cooldownRemaining}s before sending another message
            </div>
          )}
          {submitStatus === 'error' && !isOnCooldown && (
            <div className="p-4 bg-red-100 text-red-700 rounded-md">
              Failed to send email. Please try again.
            </div>
          )}

          {/* Rate Limit Progress Bar */}
          {isOnCooldown && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Please wait before sending another message</span>
                <span className="font-semibold">{cooldownRemaining}s</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${cooldownPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Your message..."
              value={formData.message}
              onChange={handleChange}
              rows={5}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || isOnCooldown}
          >
            {isSubmitting ? 'Sending...' : isOnCooldown ? `Wait ${cooldownRemaining}s...` : 'Send Email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default ContactForm;
