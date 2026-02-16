import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address").max(255),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;

      // Use custom edge function with Resend for reliable email delivery
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: {
          email: data.email,
          redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      // Don't reveal if email exists or not for security
      toast({
        title: "Check your email",
        description: "If an account exists with this email, you'll receive a reset link.",
      });
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Check your email</h3>
        <p className="text-muted-foreground mb-6">
          We've sent a password reset link to your email address. The link will expire in 1 hour.
        </p>
        <Button variant="outline" onClick={onBack} className="w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </button>
      
      <h3 className="text-lg font-semibold mb-2">Forgot your password?</h3>
      <p className="text-muted-foreground text-sm mb-6">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleForgotPassword)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
