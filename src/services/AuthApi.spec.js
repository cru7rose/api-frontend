// src/services/AuthApi.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthApi } from '@/services/AuthApi';
import { Result } from '@/domain/Result';

// Mock the underlying HTTP client (e.g., axios instance)
const mockHttpClient = {
    post: vi.fn(),
};

describe('AuthApi', () => {
    let authApi;

    beforeEach(() => {
        // Reset mocks before each test
        vi.resetAllMocks();
        // Create a new instance with the mock client for each test
        authApi = new AuthApi(mockHttpClient);
    });

    it('should call login endpoint and return Ok Result on success', async () => {
        // Arrange
        const mockUsername = 'testuser';
        const mockPassword = 'password';
        const mockApiResponse = {
            data: {
                accessToken: 'mockAccessToken',
                refreshToken: 'mockRefreshToken',
                tokenType: 'Bearer',
                username: mockUsername,
                roles: ['USER', 'ADMIN'],
            }
        };
        mockHttpClient.post.mockResolvedValue(mockApiResponse);

        // Act
        const result = await authApi.login(mockUsername, mockPassword);

        // Assert
        expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
        expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/login', { username: mockUsername, password: mockPassword });

        expect(result).toBeInstanceOf(Result);
        expect(result.ok).toBe(true);
        expect(result.value).toEqual({
            accessToken: 'mockAccessToken',
            refreshToken: 'mockRefreshToken',
            tokenType: 'Bearer',
            username: mockUsername,
            roles: ['USER', 'ADMIN'],
        });
    });

    it('should return Fail Result if API call fails', async () => {
        // Arrange
        const mockUsername = 'testuser';
        const mockPassword = 'password';
        const mockError = new Error('Network Error');
        mockHttpClient.post.mockRejectedValue(mockError);

        // Act
        const result = await authApi.login(mockUsername, mockPassword);

        // Assert
        expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
        expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/login', { username: mockUsername, password: mockPassword });

        expect(result).toBeInstanceOf(Result);
        expect(result.ok).toBe(false);
        expect(result.error).toBe(mockError);
    });

    it('should return Fail Result if API response is missing accessToken', async () => {
        // Arrange
        const mockUsername = 'testuser';
        const mockPassword = 'password';
        const mockApiResponse = {
            data: { /* accessToken is missing */ }
        };
        mockHttpClient.post.mockResolvedValue(mockApiResponse);

        // Act
        const result = await authApi.login(mockUsername, mockPassword);

        // Assert
        expect(result).toBeInstanceOf(Result);
        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toContain('accessToken missing');
    });
});