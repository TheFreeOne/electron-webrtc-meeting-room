package org.freeone.electronwebrtcmeetingroom.service;

import org.freeone.electronwebrtcmeetingroom.entity.TbUser;

public interface LoginService {
    /**
     * 用户登陆
     * @param username
     * @param password
     * @return
     */
    TbUser login(String username, String password);
    
}
