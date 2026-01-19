import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  signInWithPopup,
  getRedirectResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface UserData {
  email: string;
  displayName?: string;
  selectedArtists: string[];
  playlists: any[];
  likedSongs: any[];
  lastPlayed?: any;
  audioSettings?: any;
  createdAt: number;
  updatedAt: number;
}

interface AuthStore {
  user: User | null;
  userData: UserData | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  signUp: (email: string, password: string, name?: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  syncUserData: () => Promise<void>;
  saveUserData: (data: Partial<UserData>) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  userData: null,
  isLoading: false,
  isInitialized: false,

  signUp: async (email, password, name) => {
    set({ isLoading: true });
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document
      const userData: UserData = {
        email,
        displayName: name || email.split('@')[0],
        selectedArtists: [],
        playlists: [],
        likedSongs: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await setDoc(doc(db, 'users', result.user.uid), userData);
      set({ user: result.user, userData, isLoading: false });
      toast.success('Account created! 🎉');
      return true;
    } catch (error: any) {
      toast.error(error.message);
      set({ isLoading: false });
      return false;
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      set({ user: result.user, isLoading: false });
      await get().syncUserData();
      toast.success('Welcome back! 🎵');
      return true;
    } catch (error: any) {
      toast.error(error.message);
      set({ isLoading: false });
      return false;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true });
    try {
      // Check if running as standalone PWA (home screen)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone === true;
      
      if (isStandalone) {
        // PWA mode: Use redirect instead of popup (popup blocked in PWA)
        const { signInWithRedirect } = await import('firebase/auth');
        await signInWithRedirect(auth, googleProvider);
        return true; // Will redirect, so this won't actually return
      }
      
      // Normal browser: Use popup
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // Create new user
        const userData: UserData = {
          email: result.user.email || '',
          displayName: result.user.displayName || 'User',
          selectedArtists: [],
          playlists: [],
          likedSongs: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await setDoc(doc(db, 'users', result.user.uid), userData);
        set({ userData });
      }
      
      set({ user: result.user, isLoading: false });
      await get().syncUserData();
      toast.success('Welcome! 🎵');
      return true;
    } catch (error: any) {
      // If popup blocked, try redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          const { signInWithRedirect } = await import('firebase/auth');
          await signInWithRedirect(auth, googleProvider);
          return true;
        } catch (redirectError) {
          toast.error('Sign in failed. Please try again.');
        }
      } else {
        toast.error(error.message);
      }
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, userData: null });
      // Don't clear localStorage - keep data for when user logs back in
      toast.success('Logged out');
    } catch (error: any) {
      toast.error(error.message);
    }
  },

  syncUserData: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        set({ userData: data });
        
        // Sync to localStorage for offline use
        if (data.selectedArtists?.length > 0) {
          localStorage.setItem('musicflow_artists', JSON.stringify(data.selectedArtists));
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  },

  saveUserData: async (data) => {
    const { user, userData } = get();
    if (!user) return;

    try {
      const updated = {
        ...userData,
        ...data,
        updatedAt: Date.now(),
      };
      
      await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
      set({ userData: updated as UserData });
    } catch (error) {
      console.error('Save error:', error);
    }
  },
}));

// Listen to auth state changes
onAuthStateChanged(auth, async (user) => {
  useAuthStore.setState({ user, isInitialized: true });
  if (user) {
    await useAuthStore.getState().syncUserData();
  }
});

// Handle redirect result for PWA sign-in
getRedirectResult(auth).then(async (result) => {
  console.log('Redirect result:', result);
  if (result?.user) {
    console.log('User from redirect:', result.user.email);
    
    // Set user in state FIRST
    useAuthStore.setState({ user: result.user, isLoading: true });
    
    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    
    if (!userDoc.exists()) {
      // Create new user
      const userData = {
        email: result.user.email || '',
        displayName: result.user.displayName || 'User',
        selectedArtists: [],
        playlists: [],
        likedSongs: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, 'users', result.user.uid), userData);
      useAuthStore.setState({ userData });
    }
    
    // Sync user data and update state
    await useAuthStore.getState().syncUserData();
    useAuthStore.setState({ isLoading: false });
    console.log('PWA Google login successful!');
  } else {
    useAuthStore.setState({ isLoading: false });
  }
}).catch((error) => {
  console.error('Redirect sign-in error:', error);
  useAuthStore.setState({ isLoading: false });
});
