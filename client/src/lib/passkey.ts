import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { api } from '@/lib/api';

const friendly = (error: any): Error => {
  if (error?.name === 'NotAllowedError') {
    return new Error('Passkey request was cancelled or timed out');
  }
  if (error?.name === 'InvalidStateError') {
    return new Error('That device already has a passkey for this account');
  }
  return new Error(error?.message || 'Passkey request failed');
};

export const isPasskeySupported = () =>
  typeof window !== 'undefined' && !!window.PublicKeyCredential;

export const registerPasskey = async () => {
  const options = await api.passkeyRegisterOptions();

  let response;
  try {
    response = await startRegistration({ optionsJSON: options.data });
  } catch (error) {
    throw friendly(error);
  }

  return api.passkeyRegisterVerify({ response });
};

export const authenticateWithPasskey = async () => {
  const options = await api.passkeyAuthOptions();

  let response;
  try {
    response = await startAuthentication({ optionsJSON: options.data });
  } catch (error) {
    throw friendly(error);
  }

  return api.passkeyAuthVerify({ response });
};
