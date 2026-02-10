jest.mock('../../utils/email', () => ({
  sendEmailVerification: jest.fn().mockResolvedValue({ id: 'mock-email-id', error: null }),
  sendGroupInviteEmail: jest.fn().mockResolvedValue({ id: 'mock-email-id', error: null }),
}));

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ id: 'mock-email-id', error: null }),
      },
    })),
  };
});
