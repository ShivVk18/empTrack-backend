import crypto from 'crypto'

const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex')
}

const generateSessionToken= () => {
    return crypto.randomBytes(16).toString('hex')
}

export {generateResetToken,generateSessionToken}