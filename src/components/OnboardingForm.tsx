'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useClerkSupabaseClient } from '@/lib/clerk-supabase';

// TypeScript interfaces for the form data
interface OnboardingFormData {
  displayName: string;
  role: 'trainee' | 'employee';
  baseLocation: string;
  dietaryPreference: 'vegetarian' | 'non-veg';
  avatar: File | null;
}

// Validation errors interface
interface FormErrors {
  displayName?: string;
  role?: string;
  baseLocation?: string;
  dietaryPreference?: string;
  avatar?: string;
}

const OnboardingForm: React.FC = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const supabase = useClerkSupabaseClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<OnboardingFormData>({
    displayName: '',
    role: 'trainee',
    baseLocation: '',
    dietaryPreference: 'vegetarian',
    avatar: null,
  });

  // Avatar preview state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Validation errors state
  const [errors, setErrors] = useState<FormErrors>({});

  // Avatar input ref
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Base location options
  const baseLocationOptions = [
    'GEC 2 (Training)',
    'ECC (Employee Care)',
    'Hostel Blocks (1-30)',
    'SDB Blocks',
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // Pre-fill name from Clerk user data
  useEffect(() => {
    if (user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (fullName) {
        setFormData(prev => ({ ...prev, displayName: fullName }));
      }
      // Set avatar preview from Clerk if available
      if (user.imageUrl) {
        setAvatarPreview(user.imageUrl);
      }
    }
  }, [user]);

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Display name validation
    if (!formData.displayName) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters long';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    // Base location validation
    if (!formData.baseLocation) {
      newErrors.baseLocation = 'Please select a base location';
    }

    // Dietary preference validation
    if (!formData.dietaryPreference) {
      newErrors.dietaryPreference = 'Please select a dietary preference';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Handle role selection
  const handleRoleSelection = (role: 'trainee' | 'employee') => {
    setFormData(prev => ({
      ...prev,
      role,
    }));
    if (errors.role) {
      setErrors(prev => ({
        ...prev,
        role: undefined,
      }));
    }
  };

  // Handle dietary preference selection
  const handleDietarySelection = (preference: 'vegetarian' | 'non-veg') => {
    setFormData(prev => ({
      ...prev,
      dietaryPreference: preference,
    }));
    if (errors.dietaryPreference) {
      setErrors(prev => ({
        ...prev,
        dietaryPreference: undefined,
      }));
    }
  };

  // Handle avatar upload
  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          avatar: 'Avatar image must be smaller than 5MB',
        }));
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          avatar: 'Please select an image file',
        }));
        return;
      }

      // Store the file and create preview
      setFormData(prev => ({
        ...prev,
        avatar: file,
      }));

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      if (errors.avatar) {
        setErrors(prev => ({
          ...prev,
          avatar: undefined,
        }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }

    setIsSubmitting(true);

    try {
      let avatarUrl = user.imageUrl || null;

      // Upload avatar to Supabase storage if user selected a new one
      if (formData.avatar) {
        const fileExt = formData.avatar.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user-avatars')
          .upload(filePath, formData.avatar, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
        } else {
          // Get public URL
          const { data } = supabase.storage
            .from('user-avatars')
            .getPublicUrl(filePath);
          
          avatarUrl = data.publicUrl;
        }
      }

      // Insert or update user profile
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          display_name: formData.displayName,
          role: formData.role,
          base_location: formData.baseLocation,
          dietary_preference: formData.dietaryPreference,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        console.error('Error saving profile:', upsertError);
        alert('Failed to save profile. Please try again.');
        return;
      }

      // Success! Redirect to homepage
      router.push('/');
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-bg-body flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // User is not authenticated, will redirect via useEffect
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-body flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Form Content */}
        <form onSubmit={handleSubmit} className="px-6 py-8 pb-24">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary-dark leading-tight mb-2">
              Complete Your Profile
            </h1>
            <p className="text-sm text-text-muted leading-relaxed">
              Tell us a bit about yourself to personalize your experience.
            </p>
          </div>

          {/* Avatar Picker */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="relative cursor-pointer transition-all duration-200 hover:scale-105"
              onClick={handleAvatarClick}
            >
              <div className="w-24 h-24 bg-bg-subtle rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-3xl text-text-muted hover:border-accent-lime hover:bg-white transition-all duration-200">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <i className="ri-user-smile-line"></i>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary-dark rounded-full flex items-center justify-center text-accent-lime text-sm border-3 border-bg-body">
                <i className="ri-camera-fill"></i>
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            {errors.avatar && (
              <p className="text-red-500 text-xs mt-2 text-center">{errors.avatar}</p>
            )}
          </div>

          {/* Display Name Input */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-primary-dark uppercase tracking-wide mb-2.5">
              What&apos;s Your Name?
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="e.g. Rahul Kumar"
              className={`w-full px-4.5 py-4.5 bg-white rounded-2xl border border-transparent shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-lime/50 focus:border-accent-lime transition-all duration-200 font-sans text-base text-primary-dark ${
                errors.displayName ? 'border-red-500 focus:ring-red-500/50' : ''
              }`}
            />
            {errors.displayName && (
              <p className="text-red-500 text-xs mt-1.5">{errors.displayName}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-primary-dark uppercase tracking-wide mb-2.5">
              I am a...
            </label>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => handleRoleSelection('trainee')}
                className={`px-5 py-3 bg-white rounded-3xl text-sm font-medium shadow-soft border-2 border-transparent transition-all duration-200 flex items-center gap-2 ${
                  formData.role === 'trainee'
                    ? 'bg-accent-lime text-primary-dark border-accent-lime font-bold'
                    : 'text-text-muted hover:border-accent-lime/50'
                }`}
              >
                <i className="ri-user-star-line"></i>
                Trainee
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelection('employee')}
                className={`px-5 py-3 bg-white rounded-3xl text-sm font-medium shadow-soft border-2 border-transparent transition-all duration-200 flex items-center gap-2 ${
                  formData.role === 'employee'
                    ? 'bg-accent-lime text-primary-dark border-accent-lime font-bold'
                    : 'text-text-muted hover:border-accent-lime/50'
                }`}
              >
                <i className="ri-briefcase-4-line"></i>
                Employee
              </button>
            </div>
            {errors.role && (
              <p className="text-red-500 text-xs mt-1.5">{errors.role}</p>
            )}
          </div>

          {/* Base Location Dropdown */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-primary-dark uppercase tracking-wide mb-2.5">
              Base Location (Zone)
            </label>
            <p className="text-xs text-text-muted mb-3 -mt-1.5">
              Where do you usually start walking from?
            </p>
            <div className="relative">
              <select
                name="baseLocation"
                value={formData.baseLocation}
                onChange={handleInputChange}
                className={`w-full px-4.5 py-4.5 bg-white rounded-2xl border border-transparent shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-lime/50 focus:border-accent-lime transition-all duration-200 font-sans text-base text-primary-dark appearance-none cursor-pointer ${
                  errors.baseLocation ? 'border-red-500 focus:ring-red-500/50' : ''
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232C3E2E%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  backgroundSize: '12px',
                }}
              >
                <option value="">Select Zone...</option>
                {baseLocationOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {errors.baseLocation && (
              <p className="text-red-500 text-xs mt-1.5">{errors.baseLocation}</p>
            )}
          </div>

          {/* Dietary Preference */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-primary-dark uppercase tracking-wide mb-2.5">
              Food Preference
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleDietarySelection('vegetarian')}
                className={`bg-white p-4 rounded-3xl text-center shadow-soft border-2 border-transparent transition-all duration-200 cursor-pointer ${
                  formData.dietaryPreference === 'vegetarian'
                    ? 'border-green-500 bg-green-50'
                    : 'hover:border-accent-lime/50'
                }`}
              >
                <span className="text-2xl mb-2 block">🥗</span>
                <span className="font-semibold text-sm text-primary-dark">Vegetarian</span>
              </button>
              <button
                type="button"
                onClick={() => handleDietarySelection('non-veg')}
                className={`bg-white p-4 rounded-3xl text-center shadow-soft border-2 border-transparent transition-all duration-200 cursor-pointer ${
                  formData.dietaryPreference === 'non-veg'
                    ? 'border-green-500 bg-green-50'
                    : 'hover:border-accent-lime/50'
                }`}
              >
                <span className="text-2xl mb-2 block">🍗</span>
                <span className="font-semibold text-sm text-primary-dark">Non-Veg</span>
              </button>
            </div>
            {errors.dietaryPreference && (
              <p className="text-red-500 text-xs mt-1.5">{errors.dietaryPreference}</p>
            )}
          </div>
        </form>

        {/* Sticky Footer Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-body via-bg-body to-transparent">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-4.5 py-4.5 bg-primary-dark text-white rounded-3xl text-base font-semibold flex items-center justify-center gap-2.5 shadow-float hover:shadow-lg transition-all duration-200 active:scale-95 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>Saving...</>
            ) : (
              <>Let&apos;s Eat! <i className="ri-arrow-right-line"></i></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingForm;