import crypto from 'crypto'

export const createInvitationToken = (): string => {
    return crypto.randomBytes(32).toString("hex");
};