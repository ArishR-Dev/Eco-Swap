import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RoleBackground } from '@/components/auth/RoleBackground';
import { GlassCard } from '@/components/auth/GlassCard';
import authService from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function useQueryParam(name: string): string | null {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return params.get(name);
}

export default function ResetPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const token = useQueryParam('token');
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast({
        title: 'Invalid link',
        description: 'This reset link is missing or invalid.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(token, data.password);
      setSuccess(true);
      toast({
        title: 'Password updated',
        description: 'You can now sign in with your new password.',
      });
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to reset password. The link may have expired.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <RoleBackground role="USER" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <GlassCard className="p-8">
          {!success ? (
            <>
              <motion.div variants={itemVariants} className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Set a new password</h2>
                <p className="mt-2 text-muted-foreground">
                  Enter a strong password to secure your EcoSwap account.
                </p>
              </motion.div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="h-11 bg-background/50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Repeat password"
                              className="h-11 bg-background/50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-medium"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Updating...' : 'Update password'}
                    </Button>
                  </motion.div>
                </form>
              </Form>

              <motion.div variants={itemVariants} className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Password updated</h2>
              <p className="text-muted-foreground mb-4">
                Redirecting you to the login page...
              </p>
              <Button asChild className="h-10 px-6">
                <Link to="/login">Go to login</Link>
              </Button>
            </motion.div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}

