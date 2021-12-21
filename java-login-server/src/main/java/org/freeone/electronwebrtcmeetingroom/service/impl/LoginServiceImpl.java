package org.freeone.electronwebrtcmeetingroom.service.impl;

import org.freeone.electronwebrtcmeetingroom.dao.TbUserDao;
import org.freeone.electronwebrtcmeetingroom.entity.TbUser;
import org.freeone.electronwebrtcmeetingroom.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class LoginServiceImpl implements LoginService {

    @Autowired
    private TbUserDao userDao;
    /**
     * 用户登陆
     *
     * @param username
     * @param password
     * @return
     */
    @Override
    public TbUser login(String username, String password) {
        return userDao.selectByUsernamePassword(username,password);
    }
}
