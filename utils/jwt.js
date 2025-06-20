import jwt from 'jsonwebtoken'

export function generateAccessToken(user) {
    return jwt.sign({
        _id: user.id,
        email: user.email,
        companyId: user.companyId,
        name: user.name,
        role:user.role,
        userType:user.userType || "user"
    }, 
    process.env.ACCESS_TOKEN_SECRET, 
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY })
}

export function generateRefreshToken(user) {
    return jwt.sign({
        _id: user.id,
        userType:user.userType || 'user'
    }, 
    process.env.REFRESH_TOKEN_SECRET, 
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY })
}