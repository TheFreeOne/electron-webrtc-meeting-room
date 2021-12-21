package org.freeone.android.meeting.room.client.lib;

import java.util.Locale;

public class UrlFactory {

  private static final String HOSTNAME = "v3demo.mediasoup.org";
  //  private static final String HOSTNAME = "192.168.1.103";
  private static final int PORT = 4443;

  public static String getInvitationLink(String roomId, boolean forceH264, boolean forceVP9) {
    String url = String.format(Locale.US, "http://%s/?roomId=%s", HOSTNAME, roomId);
    if (forceH264) {
      url += "&forceH264=true";
    } else if (forceVP9) {
      url += "&forceVP9=true";
    }
    return url;
  }

  public static String getProtooUrl(
      String roomId, String peerId, boolean forceH264, boolean forceVP9) {
//    String url =
//        String.format(
//            Locale.US, "wss://%s:%d/?roomId=%s&peerId=%s", HOSTNAME, PORT, roomId, peerId);
//    if (forceH264) {
//      url += "&forceH264=true";
//    } else if (forceVP9) {
//      url += "&forceVP9=true";
//    }
//    return url;
    return "ws://192.168.0.142:3016/socket.io/?EIO=4&transport=websocket&sid="+roomId+peerId;
  }
}
