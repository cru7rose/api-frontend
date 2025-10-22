// src/controllers/AuthController.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from '@/controllers/AuthController';
import { Result } from '@/domain/Result';

// Mock the dependencies (AuthApi, AuthSessionService, ApiAuthBinder)
const mockAuthApi = {
    login: vi.fn(),
};
const mockSessionService = {
    save: vi.fn(),
    clear: vi.fn(),
    isAuthenticated: vi.fn(),
    getUser: vi.fn(),
    getAccessToken: vi.fn(),
    getTokenType: vi.fn(),
};
const mockApiBinder = {
    bind: vi.fn(),
    unbind: vi.fn(),
};

describe('AuthController', () => {
    let authController;

    beforeEach(() => {
        vi.resetAllMocks();
        authController = new AuthController(mockAuthApi, mockSessionService, mockApiBinder);
    });

    describe('login', () => {
        it('should call AuthApi, save session, bind token, and return Ok Result on success', async () => {
            // Arrange
            const username = 'test';
            const password = 'pw';
            const mockSessionData = {
                accessToken: 'atoken',
                refreshToken: 'rtoken',
                tokenType: 'Bearer',
                username: username,
                roles: ['USER'],
            };
            const mockSnapshot = { isAuthenticated: true, user: { username: username, roles: ['USER'] } };
            mockAuthApi.login.mockResolvedValue(Result.ok(mockSessionData));
            // Mock snapshot call within the controller's login method
            vi.spyOn(authController, 'snapshot').mockReturnValue(mockSnapshot);

            // Act
            const result = await authController.login(username, password);

            // Assert
            expect(mockAuthApi.login).toHaveBeenCalledWith(username, password);
            expect(mockSessionService.save).toHaveBeenCalledWith(mockSessionData);
            expect(mockApiBinder.bind).toHaveBeenCalledWith(mockSessionData.accessToken, mockSessionData.tokenType);
            expect(result.ok).toBe(true);
            expect(result.value).toEqual(mockSnapshot); // Login returns the snapshot
        });

        it('should return Fail Result if AuthApi.login fails', async () => {
            // Arrange
            const username = 'test';
            const password = 'pw';
            const mockError = new Error('Invalid credentials');
            mockAuthApi.login.mockResolvedValue(Result.fail(mockError));

            // Act
            const result = await authController.login(username, password);

            // Assert
            expect(mockAuthApi.login).toHaveBeenCalledWith(username, password);
            expect(mockSessionService.save).not.toHaveBeenCalled();
            expect(mockApiBinder.bind).not.toHaveBeenCalled();
            expect(result.ok).toBe(false);
            expect(result.error).toBe(mockError);
        });
    });

    describe('logout', () => {
        it('should clear session and unbind token', async () => {
            // Act
            const result = await authController.logout();

            // Assert
            expect(mockSessionService.clear).toHaveBeenCalledTimes(1);
            expect(mockApiBinder.unbind).toHaveBeenCalledTimes(1);
            expect(result.ok).toBe(true);
        });
    });

    describe('hydrateFromStorage', () => {
        it('should bind token if found in session', () => {
            // Arrange
            mockSessionService.getAccessToken.mockReturnValue('storedToken');
            mockSessionService.getTokenType.mockReturnValue('Bearer');

            // Act
            authController.hydrateFromStorage();

            // Assert
            expect(mockApiBinder.bind).toHaveBeenCalledWith('storedToken', 'Bearer');
        });

        it('should not bind token if not found in session', () => {
            // Arrange
            mockSessionService.getAccessToken.mockReturnValue(null);

            // Act
            authController.hydrateFromStorage();

            // Assert
            expect(mockApiBinder.bind).not.toHaveBeenCalled();
        });
    });

    describe('snapshot', () => {
        it('should return current auth state from session service', () => {
            // Arrange
            mockSessionService.isAuthenticated.mockReturnValue(true);
            mockSessionService.getUser.mockReturnValue({ username: 'snapUser', roles: ['TEST']});
            mockSessionService.getAccessToken.mockReturnValue('snapToken');

            // Act
            const snapshot = authController.snapshot();

            // Assert
            expect(snapshot).toEqual({
                isAuthenticated: true,
                user: { username: 'snapUser', roles: ['TEST']},
                tokenPresent: true
            });
        });
    });
});