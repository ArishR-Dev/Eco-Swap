import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, CheckCircle, Sparkles } from 'lucide-react';
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setResetLink(null);
    try {
      const res = await authService.forgotPassword(data.email);
      setIsSubmitted(true);
      if (res.reset_link) setResetLink(res.reset_link);
      toast({
        title: res.reset_link ? 'Reset link ready' : 'Check your email',
        description: res.reset_link
          ? 'Use the link below to reset your password (development mode).'
          : "If that email exists, we've sent a reset link.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to send reset link. Please try again.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      {/* Background */}
      <RoleBackground role="USER" />

      {/* Floating particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/30"
          style={{
            width: 6 + Math.random() * 8,
            height: 6 + Math.random() * 8,
            left: `${15 + Math.random() * 70}%`,
            top: `${15 + Math.random() * 70}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <GlassCard className="p-8 min-h-[420px]">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="form"
                variants={{ visible: { opacity: 1 }, hidden: { opacity: 1 } }}
                initial="visible"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-8 text-center">
                  <motion.div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <Mail className="h-8 w-8 text-primary" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-foreground">Forgot Password?</h2>
                  <p className="mt-2 text-muted-foreground">
                    No worries! Enter your email and we'll send you reset instructions.
                  </p>
                </motion.div>

                {/* Form */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <motion.div variants={itemVariants}>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                className="h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                        className="w-full h-12 text-base font-medium relative overflow-hidden group"
                        disabled={isLoading}
                      >
                        <motion.span
                          className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.5 }}
                        />
                        {isLoading ? (
                          <motion.div
                            className="flex items-center gap-2"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <Sparkles className="h-4 w-4" />
                            Sending...
                          </motion.div>
                        ) : (
                          'Send Reset Link'
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </Form>

                {/* Back to login */}
                <motion.div variants={itemVariants} className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Link>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                {/* Success animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                  >
                    <CheckCircle className="h-10 w-10 text-primary" />
                  </motion.div>
                </motion.div>

                {/* Celebration particles */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-primary"
                    style={{
                      width: 4 + Math.random() * 4,
                      height: 4 + Math.random() * 4,
                      left: '50%',
                      top: '40%',
                    }}
                    initial={{ scale: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: (Math.random() - 0.5) * 150,
                      y: (Math.random() - 0.5) * 150,
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 0.8,
                      delay: 0.3 + i * 0.05,
                    }}
                  />
                ))}

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold text-foreground mb-2"
                >
                  Check Your Email
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground mb-4"
                >
                  {resetLink
                    ? 'In development mode the reset link is below (no email sent). Use it to set a new password.'
                    : "We've sent password reset instructions to your email address."}
                </motion.p>

                {resetLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="mb-6"
                  >
                    <Button
                      asChild
                      className="w-full h-11"
                    >
                      <Link to={resetLink}>Open reset password page</Link>
                    </Button>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  <Button asChild className="w-full h-11" variant={resetLink ? 'outline' : 'default'}>
                    <Link to="/login">Return to Login</Link>
                  </Button>
                  
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Didn't receive the email? Try again
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  );
}
