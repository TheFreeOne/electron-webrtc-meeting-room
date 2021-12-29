package org.freeone.electronwebrtcmeetingroom.controller;


import org.freeone.electronwebrtcmeetingroom.entity.TbUser;
import org.freeone.electronwebrtcmeetingroom.service.LoginService;
import org.freeone.electronwebrtcmeetingroom.util.JWTUtil;
import org.freeone.electronwebrtcmeetingroom.util.ResultModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;


@RestController
public class LoginController {

    @Autowired
    private LoginService loginService;

    /**
     * 登陆
     * @param username
     * @param password
     * @return
     */
    @PostMapping("/login.json")
    public ResultModel login(String username, String password) {
        TbUser user = loginService.login(username, password);
        if (user == null) {
            return ResultModel.failed("登陆失败");
        }
        String token = JWTUtil.createToken(user.getId(), username);
        return ResultModel.okWithData(new HashMap<String, String>(2) {{
            put("token", token);
            put("nickname", user.getNickname());
        }});
    }

}
