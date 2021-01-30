package org.freeone.electronwebrtcmeetingroom.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.freeone.electronwebrtcmeetingroom.entity.TbUser;

@Mapper
public interface TbUserDao {

    TbUser selectByUsernamePassword(@Param("username") String username, @Param("password") String password);

}
