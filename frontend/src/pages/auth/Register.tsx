import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Recycle, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { RoleBackground } from '@/components/auth/RoleBackground';
import { RoleIllustration } from '@/components/auth/RoleIllustration';
import { RoleContent } from '@/components/auth/RoleContent';
import { GlassCard } from '@/components/auth/GlassCard';
import { RoleSelector } from '@/components/auth/RoleSelector';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').max(255),
  phone: z.string().min(10, 'Please enter a valid phone number').max(20),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  address: z.string().min(10, 'Please enter your full address').max(500),
  role: z.enum(['USER', 'COLLECTOR', 'RECYCLER']),
  vehicleType: z.string().optional(),
  licenseNumber: z.string().optional(),
  facilityName: z.string().optional(),
  certification: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.role === 'COLLECTOR') {
    return data.vehicleType && data.licenseNumber;
  }
  return true;
}, {
  message: 'Vehicle type and license are required for collectors',
  path: ['vehicleType'],
}).refine((data) => {
  if (data.role === 'RECYCLER') {
    return data.facilityName && data.certification;
  }
  return true;
}, {
  message: 'Facility name and certification are required for recyclers',
  path: ['facilityName'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      address: '',
      role: 'USER',
      vehicleType: '',
      licenseNumber: '',
      facilityName: '',
      certification: '',
    },
  });

  const selectedRole = form.watch('role') as 'USER' | 'COLLECTOR' | 'RECYCLER';

  const onSubmit = async (data: RegisterFormData) => {
    const result = await register({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      address: data.address,
      role: data.role as UserRole,
      vehicleType: data.vehicleType,
      licenseNumber: data.licenseNumber,
      facilityName: data.facilityName,
      certification: data.certification,
    });

    if (result.success) {
      if (data.role === 'COLLECTOR' || data.role === 'RECYCLER') {
        setPendingApproval(true);
        setRegistrationSuccess(true);
      } else {
        toast({
          title: 'Welcome!',
          description: 'Your account has been created successfully.',
        });
        navigate('/user', { replace: true });
      }
    } else {
      toast({
        title: 'Registration failed',
        description: result.error || 'An error occurred during registration',
        variant: 'destructive',
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const roleColors = {
    USER: 'from-emerald-500 via-emerald-600 to-teal-600',
    COLLECTOR: 'from-blue-600 via-blue-700 to-indigo-700',
    RECYCLER: 'from-violet-600 via-violet-700 to-purple-700',
  };

  if (registrationSuccess) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
        <RoleBackground role={selectedRole} />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="max-w-md text-center p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
            >
              <CheckCircle className="h-12 w-12 text-primary" />
            </motion.div>
            
            {/* Celebration particles */}
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-primary"
                style={{
                  width: 4 + Math.random() * 6,
                  height: 4 + Math.random() * 6,
                  left: '50%',
                  top: '35%',
                }}
                initial={{ scale: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1,
                  delay: 0.2 + i * 0.05,
                }}
              />
            ))}
            
            <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
            <p className="text-muted-foreground mb-6">
              {pendingApproval
                ? 'Your account has been created and is pending admin approval. You will be notified once approved.'
                : 'Your account has been created successfully.'}
            </p>
            <Button asChild className="w-full">
              <Link to="/login">
                Go to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
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
            <RoleContent role={selectedRole} type="register" />
          </motion.div>
        </div>
      </motion.div>

      {/* Right side - Register form */}
      <div className="relative flex w-full items-center justify-center overflow-y-auto p-6 lg:w-1/2">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-lg py-8"
        >
          {/* Mobile logo */}
          <motion.div 
            variants={itemVariants}
            className="mb-6 flex items-center justify-center lg:hidden"
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

          <GlassCard className="p-6 lg:p-8">
            <motion.div variants={itemVariants} className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
              <p className="text-muted-foreground mt-1">Join our eco-friendly community</p>
            </motion.div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Role Selection */}
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I want to register as</FormLabel>
                        <RoleSelector 
                          value={field.value} 
                          onChange={field.onChange}
                        />
                        <FormDescription className="text-center mt-2">
                          {field.value === 'USER' && 'Request e-waste pickups from your location'}
                          {field.value === 'COLLECTOR' && 'Collect e-waste from citizens (requires approval)'}
                          {field.value === 'RECYCLER' && 'Process and recycle e-waste (requires approval)'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John Doe" 
                              className="h-10 bg-background/50"
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
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+1234567890" 
                              className="h-10 bg-background/50"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                </div>

                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="you@example.com" 
                            className="h-10 bg-background/50"
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
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your full address" 
                            className="resize-none bg-background/50 min-h-[70px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Collector-specific fields */}
                <AnimatePresence>
                  {selectedRole === 'COLLECTOR' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 overflow-hidden"
                    >
                      <FormField
                        control={form.control}
                        name="vehicleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background/50">
                                  <SelectValue placeholder="Select vehicle" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Van">Van</SelectItem>
                                <SelectItem value="Truck">Truck</SelectItem>
                                <SelectItem value="Pickup">Pickup</SelectItem>
                                <SelectItem value="Bike">Bike/Motorcycle</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="licenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="COL-2024-XXX" 
                                className="bg-background/50"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Recycler-specific fields */}
                <AnimatePresence>
                  {selectedRole === 'RECYCLER' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 overflow-hidden"
                    >
                      <FormField
                        control={form.control}
                        name="facilityName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facility Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Green Recycling Co." 
                                className="bg-background/50"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="certification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certification</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ISO-14001" 
                                className="bg-background/50"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Approval notice */}
                <AnimatePresence>
                  {(selectedRole === 'COLLECTOR' || selectedRole === 'RECYCLER') && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3"
                    >
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        <strong>Note:</strong> {selectedRole === 'COLLECTOR' ? 'Collector' : 'Recycler'} accounts require admin approval.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Password fields */}
                <div className="grid grid-cols-2 gap-3">
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
                                className="h-10 bg-background/50 pr-10"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
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
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="h-10 bg-background/50 pr-10"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                </div>

                <motion.div variants={itemVariants} className="pt-2">
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
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>

            <motion.div variants={itemVariants} className="mt-6 pt-6 border-t border-border/50">
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
