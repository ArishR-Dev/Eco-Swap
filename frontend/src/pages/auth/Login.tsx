import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Recycle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { RoleBackground } from '@/components/auth/RoleBackground';
import { RoleIllustration } from '@/components/auth/RoleIllustration';
import { RoleContent } from '@/components/auth/RoleContent';
import { GlassCard } from '@/components/auth/GlassCard';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'USER' | 'COLLECTOR' | 'RECYCLER' | 'ADMIN'>('USER');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const from = (location.state as any)?.from?.pathname;

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await login({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
      role: selectedRole,
    });

    if (result.success && result.data) {
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${result.data.user.name}`,
      });
      
      const roleRedirects: Record<string, string> = {
        ADMIN: '/admin',
        USER: '/user',
        COLLECTOR: '/collector',
        RECYCLER: '/recycler',
      };
      
      const redirectPath = from || roleRedirects[result.data.user.role] || '/';
      navigate(redirectPath, { replace: true });
    } else {
      toast({
        title: 'Login failed',
        description: result.error || 'An error occurred during login',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = (role: string) => {
    const validRole = role as 'USER' | 'COLLECTOR' | 'RECYCLER' | 'ADMIN';
    setSelectedRole(validRole);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const roleColors = {
    USER: 'from-emerald-500 via-emerald-600 to-teal-600',
    COLLECTOR: 'from-blue-600 via-blue-700 to-indigo-700',
    RECYCLER: 'from-violet-600 via-violet-700 to-purple-700',
    ADMIN: 'from-slate-600 via-slate-700 to-zinc-700',
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Role-based animated background */}
      <RoleBackground role={selectedRole} />

      {/* Left side - Role-based illustration */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden lg:flex lg:w-1/2 relative"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRole}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
              'absolute inset-0 bg-gradient-to-br',
              roleColors[selectedRole]
            )}
          />
        </AnimatePresence>
        
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <RoleIllustration role={selectedRole} />
          
          <motion.div 
            className="mt-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <RoleContent role={selectedRole} type="login" />
          </motion.div>
        </div>
      </motion.div>

      {/* Right side - Login form */}
      <div className="relative flex w-full items-center justify-center p-6 lg:w-1/2">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <motion.div 
            variants={itemVariants}
            className="mb-8 flex items-center justify-center lg:hidden"
          >
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="rounded-2xl bg-primary p-3 shadow-lg shadow-primary/30">
                <Recycle className="h-8 w-8 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">EcoWaste</span>
            </motion.div>
          </motion.div>

          <GlassCard className="p-8">
            <motion.div variants={itemVariants} className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
              <p className="text-muted-foreground mt-1">
                Sign in to continue to your dashboard
              </p>
            </motion.div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Role selector */}
                <motion.div variants={itemVariants}>
                  <FormLabel className="text-sm font-medium mb-3 block">Sign in as</FormLabel>
                  <RoleSelector 
                    value={selectedRole} 
                    onChange={handleRoleChange}
                    showAdmin
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Select your role to continue
                  </p>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <motion.div whileFocus={{ scale: 1.01 }}>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              autoComplete="email"
                              className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                              {...field}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              autoComplete="current-password"
                              className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10"
                              {...field}
                            />
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </motion.button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Remember me
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium relative overflow-hidden group"
                    disabled={loading}
                  >
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.5 }}
                    />
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>

            <motion.div variants={itemVariants} className="mt-6 pt-6 border-t border-border/50">
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Create account
                </Link>
              </p>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
