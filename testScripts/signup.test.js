const axios = require('axios').default;
const User = require('../src/models/userSchema');

describe('signup', () => {
    // conditions are 
    // 1. success message and user info received 
    it('successful signup', () => {
        userData = {
            "email": "test@gmail.com",
            "password": "qwerty123",
            "userName": "test",
            "profPic": "picture link"
        };
        const URL = "http://localhost:3000";
        axios.post(`${URL}/signup`, userData)
            .then((response) => {
                const res = {
                    "email": response.data.email,
                    "password": response.data.password,
                    "userName": response.data.userName,
                    "profPic": response.data.profPic
                };
                console.log(res);
                // expect(response.status).toBe(200);
                expect(res).toEqual(userData);

                User.deleteOne({ "email": "test@gmail.com" });

            })
            .catch((results) => {
                console.log(results);
            });
    });

    // 2. email already exists (later can be implemented in front end)
});