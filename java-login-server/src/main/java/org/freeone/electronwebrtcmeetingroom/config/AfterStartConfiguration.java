package org.freeone.electronwebrtcmeetingroom.config;


import org.freeone.electronwebrtcmeetingroom.dao.TableCheckMapper;
import org.freeone.electronwebrtcmeetingroom.util.SpringUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Configuration
public class AfterStartConfiguration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger("After Spring Start");
    public static List<String> tableNameList = new ArrayList<>();

    @Autowired
    TableCheckMapper tableCheckMapper;


    @Override
    public void run(ApplicationArguments args) throws Exception {


        try {
            log.info("准备校验【数据库连接】");
            DataSource dataSource = SpringUtil.getBean(DataSource.class);
            dataSource.getConnection().close();
            log.info("准备校验【数据库连接】结果：连接成功");

            List<Map<String, String>> tables = tableCheckMapper.getTables();
            tables.forEach(table ->{
                System.out.println(table);
                String tableName = table.get("TABLE_NAME");
                tableNameList.add(tableName);
            });
            if (!tableNameList.contains("tb_user")){
                log.info("尝试创建 tb_user");
                try {
                    tableCheckMapper.createTbUser();
                    log.info("创建 tb_user 成功");
                } catch (Exception e) {
                    log.error("创建 tb_user 出错",e);
                }

            }
        }catch (Exception e){
            log.info("准备校验【数据库连接】结果：连接失败");
            log.error("after start error", e);
        }


    }


}
