// Thin wrapper around RevenueCat (react-native-purchases).
// RevenueCat handles Google Play Billing, receipt validation and restores, and
// tells us which entitlements the user owns. In Expo Go it runs in its own
// "Preview API Mode" (mocked), so the app keeps working there.
import { HAS_REVENUECAT_KEY, PRODUCTS, REVENUECAT_API_KEY } from './config';

let Purchases = null;
try {
  Purchases = require('react-native-purchases').default;
} catch {
  Purchases = null;
}

let configured = false;

export const purchasesSupported = !!Purchases && HAS_REVENUECAT_KEY;

function entitlementsFrom(customerInfo) {
  return new Set(Object.keys(customerInfo?.entitlements?.active ?? {}));
}

/** Configures RevenueCat and returns the entitlements the user already owns. */
export async function initPurchases(onChange) {
  if (!purchasesSupported || configured) return new Set();
  try {
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    configured = true;
    Purchases.addCustomerInfoUpdateListener((info) => onChange(entitlementsFrom(info)));
    return entitlementsFrom(await Purchases.getCustomerInfo());
  } catch (e) {
    if (__DEV__) console.warn('[purchases] init failed', e);
    return new Set();
  }
}

/** Returns { [packageId]: { pkg, priceString } } from the current offering. */
export async function loadPackages() {
  if (!configured) return {};
  try {
    const offerings = await Purchases.getOfferings();
    const available = offerings.current?.availablePackages ?? [];
    const map = {};
    for (const pkg of available) {
      map[pkg.identifier] = { pkg, priceString: pkg.product.priceString };
    }
    return map;
  } catch (e) {
    if (__DEV__) console.warn('[purchases] offerings failed', e);
    return {};
  }
}

/**
 * Buys a package. Resolves { ok, entitlements, cancelled, error }.
 * In development without a store connection, purchases are simulated so the
 * unlock flow can be tested in Expo Go.
 */
export async function buy(packageId, packages) {
  const entry = packages[packageId];
  if (!entry) {
    if (__DEV__) {
      const product = PRODUCTS.find((p) => p.packageId === packageId);
      return { ok: true, simulated: true, entitlements: new Set(product?.grants ?? []) };
    }
    return { ok: false, error: 'This item is not available right now. Please try again later.' };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(entry.pkg);
    return { ok: true, entitlements: entitlementsFrom(customerInfo) };
  } catch (e) {
    if (e?.userCancelled || e?.code === Purchases.PURCHASES_ERROR_CODE?.PURCHASE_CANCELLED_ERROR) {
      return { ok: false, cancelled: true };
    }
    return { ok: false, error: e?.message ?? 'Purchase failed.' };
  }
}

export async function restore() {
  if (!configured) return { ok: false, error: 'Store not available.' };
  try {
    return { ok: true, entitlements: entitlementsFrom(await Purchases.restorePurchases()) };
  } catch (e) {
    return { ok: false, error: e?.message ?? 'Restore failed.' };
  }
}
