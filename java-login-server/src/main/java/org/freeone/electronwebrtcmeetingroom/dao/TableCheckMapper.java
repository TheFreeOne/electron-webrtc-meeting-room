package org.freeone.electronwebrtcmeetingroom.dao;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;
@Mapper
public interface TableCheckMapper {

    List<Map<String,String>> getTables();

    void createTbUser();
}
