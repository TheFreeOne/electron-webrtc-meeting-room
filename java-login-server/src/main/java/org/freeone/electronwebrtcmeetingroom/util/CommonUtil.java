package org.freeone.electronwebrtcmeetingroom.util;

//import com.google.zxing.BarcodeFormat;
//import com.google.zxing.WriterException;
//import com.google.zxing.client.j2se.MatrixToImageWriter;
//import com.google.zxing.common.BitMatrix;
//import com.google.zxing.qrcode.QRCodeWriter;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Base64;
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

    /**
     * 生成订单的编号order_sn
     */
    public static synchronized String generateOrderNumber() {
        String numberString = "0123456789";
        String timeStr = new SimpleDateFormat("yyyyMMddHHmmssSSS").format(new Date());
        Random random = new Random();
        for (int i = 0; i < 10; i++) {
            timeStr += numberString.charAt(random.nextInt(10));
        }
//        int number = (int)(Math.random()*100000*100000);// z这种方式,当超过int的最大值时只能返回int的最大值2147483647
        return timeStr;
    }

//
//    public static String toBase64(String content) throws IOException, WriterException {
//        QRCodeWriter qrCodeWriter = new QRCodeWriter();
//        //设置二维码图片宽高
//        BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, 600, 600);
//        //输出到指定路径
////          Path path = FileSystems.getDefault().getPath("C:/Users/admin/Desktop/MyQRCode.png");
////          MatrixToImageWriter.writeToPath(bitMatrix1,"PNG",path);
//        // 写到输出流
//        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
//        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
//        //转换为base64
//        Base64.Encoder encoder1 = Base64.getEncoder();
//        String qrCodeImage = "data:image/jpeg;base64," + encoder1.encodeToString(outputStream.toByteArray());
//        return qrCodeImage;
//    }
}
