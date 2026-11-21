import { Platform } from 'react-native';
import { UNLOCK_PRICE_DISPLAY, UNLOCK_PRODUCT_ID } from '../theme';

/**
 * Clean monetization abstraction ready to wire to Apple StoreKit 2 or RevenueCat
 * (`react-native-purchases`) before App Store submission.
 *
 * For immediate browser & simulator testing, this default provider stores
 * entitlement state locally and exposes a clean local unlock toggle.
 */

export interface EntitlementState {
  unlockAll: boolean;
  productId: string;
  priceDisplay: string;
  source: 'local-preview' | 'storekit' | 'revenuecat';
}

export interface PurchaseResult {
  success: boolean;
  unlocked: boolean;
  message: string;
}

export interface PurchaseProvider {
  getEntitlements(): Promise<EntitlementState>;
  purchaseUnlockAll(): Promise<PurchaseResult>;
  restorePurchases(): Promise<PurchaseResult>;
  setLocalPreviewUnlocked(unlocked: boolean): Promise<EntitlementState>;
}

const STORAGE_KEY = 'whits_world_unlock_all_v1';

function readLocalUnlock(): boolean {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
  return false;
}

function writeLocalUnlock(unlocked: boolean): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, unlocked ? 'true' : 'false');
    } catch {
      // Ignore storage failures in restricted contexts
    }
  }
}

class LocalPreviewPurchaseProvider implements PurchaseProvider {
  private unlocked: boolean = readLocalUnlock();

  async getEntitlements(): Promise<EntitlementState> {
    return {
      unlockAll: this.unlocked,
      productId: UNLOCK_PRODUCT_ID,
      priceDisplay: UNLOCK_PRICE_DISPLAY,
      source: 'local-preview',
    };
  }

  /**
   * StoreKit / RevenueCat integration point:
   * Replace with `Purchases.purchasePackage(unlockAllPackage)` in production iOS builds.
   */
  async purchaseUnlockAll(): Promise<PurchaseResult> {
    await new Promise((r) => setTimeout(r, 450));
    this.unlocked = true;
    writeLocalUnlock(true);
    return {
      success: true,
      unlocked: true,
      message: 'All Whit’s World games are now unlocked! Have fun!',
    };
  }

  /**
   * StoreKit / RevenueCat integration point:
   * Replace with `Purchases.restorePurchases()` in production iOS builds.
   */
  async restorePurchases(): Promise<PurchaseResult> {
    await new Promise((r) => setTimeout(r, 450));
    const stored = readLocalUnlock();
    this.unlocked = stored;
    if (stored) {
      return {
        success: true,
        unlocked: true,
        message: 'Previous purchase restored — all games unlocked!',
      };
    }
    return {
      success: true,
      unlocked: false,
      message:
        'No previous StoreKit purchase found on this device. Use the preview toggle below to test unlocked games.',
    };
  }

  async setLocalPreviewUnlocked(unlocked: boolean): Promise<EntitlementState> {
    this.unlocked = unlocked;
    writeLocalUnlock(unlocked);
    return this.getEntitlements();
  }
}

export const purchaseService: PurchaseProvider =
  new LocalPreviewPurchaseProvider();
