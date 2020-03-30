var LocalStrategy = require('passport-local').Strategy
var bcrypt = require('bcrypt');

function initialize(passport, getUserByEmail, getUserById) {

    const authenticateUser = (email, password, done) => {
        const user = getUserByEmail(email)
        if(user == null) {
            return done(null, false, {message: 'No user with that email'})
        }
    
    
    bcrypt.compare(password, user.password, function(err, bool){
        if(bool){
            return done(null, user)
        } else {
            if(err){
                return done(err)
            } else {
                return done(null, false, {message: "Password Incorrect"})
            }
        }
    })
    }

    passport.use(new LocalStrategy({usernameField: 'email'}, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
        return done(null, getUserById(id))
    })

}

module.exports = initialize