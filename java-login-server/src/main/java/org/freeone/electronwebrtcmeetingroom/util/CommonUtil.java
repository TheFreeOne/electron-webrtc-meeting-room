package org.freeone.electronwebrtcmeetingroom.util;


import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Random;
import java.util.UUID;

public class CommonUtil {


    /**
     * 创建uuid
     *
     * @return
     */
    public static String getUUID() {
        return UUID.randomUUID().toString().replace("-", "");
    }



}
