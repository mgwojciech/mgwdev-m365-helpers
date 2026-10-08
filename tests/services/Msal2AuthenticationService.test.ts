/**
 * @jest-environment jsdom
 */
///<reference types="jest" />
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { Msal2AuthenticationService } from '../../src/services/Msal2AuthenticationService';

const mockMsal = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getActiveAccount: jest.fn(),
    getAllAccounts: jest.fn(),
    acquireTokenSilent: jest.fn(),
    ssoSilent: jest.fn(),
    loginPopup: jest.fn(),
};

jest.mock('@azure/msal-browser', () => {
    class InteractionRequiredAuthError extends Error {
        constructor(message?: string) {
            super(message);
            // Required for `instanceof` to hold under the ES5 target, where extending
            // a built-in resets the prototype chain.
            Object.setPrototypeOf(this, InteractionRequiredAuthError.prototype);
        }
    }
    return { InteractionRequiredAuthError, PublicClientApplication: jest.fn(() => mockMsal) };
});

const RESOURCE = 'https://contoso.crm4.dynamics.com';
const account = { homeAccountId: 'acc' };
const createService = () =>
    new Msal2AuthenticationService({ clientId: 'client-' + Math.random(), tenantId: 'tenant' });

beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockMsal.getActiveAccount.mockReturnValue(null);
    mockMsal.getAllAccounts.mockReturnValue([]);
});

describe('Msal2AuthenticationService.getAccessToken', () => {
    it('renews with acquireTokenSilent when an account is cached', async () => {
        mockMsal.getAllAccounts.mockReturnValue([account]);
        mockMsal.acquireTokenSilent.mockResolvedValue({ accessToken: 'silent-token' });

        expect(await createService().getAccessToken(RESOURCE)).toBe('silent-token');

        expect(mockMsal.acquireTokenSilent).toHaveBeenCalledWith({ account, scopes: [`${RESOURCE}/.default`] });
        expect(mockMsal.ssoSilent).not.toHaveBeenCalled();
    });

    it('falls back to ssoSilent when no account is cached', async () => {
        mockMsal.ssoSilent.mockResolvedValue({ accessToken: 'sso-token' });

        expect(await createService().getAccessToken(RESOURCE)).toBe('sso-token');

        expect(mockMsal.acquireTokenSilent).not.toHaveBeenCalled();
    });

    it('logs in interactively when silent renewal requires interaction', async () => {
        mockMsal.getAllAccounts.mockReturnValue([account]);
        mockMsal.acquireTokenSilent.mockRejectedValue(new InteractionRequiredAuthError('interaction_required'));
        mockMsal.loginPopup.mockResolvedValue({ accessToken: 'popup-token' });

        expect(await createService().getAccessToken(RESOURCE)).toBe('popup-token');

        expect(mockMsal.loginPopup).toHaveBeenCalledTimes(1);
    });

    it('rethrows other silent renewal errors instead of returning an empty token', async () => {
        mockMsal.getAllAccounts.mockReturnValue([account]);
        mockMsal.acquireTokenSilent.mockRejectedValue(new Error('monitor_window_timeout'));

        await expect(createService().getAccessToken(RESOURCE)).rejects.toThrow('monitor_window_timeout');

        expect(mockMsal.loginPopup).not.toHaveBeenCalled();
    });
});
