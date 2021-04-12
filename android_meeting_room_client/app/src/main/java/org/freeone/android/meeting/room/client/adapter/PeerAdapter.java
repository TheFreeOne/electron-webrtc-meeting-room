package org.freeone.android.meeting.room.client.adapter;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Rect;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.SurfaceHolder;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import org.freeone.android.meeting.room.client.R;
import org.freeone.android.meeting.room.client.lib.PeerConnectionUtils;
import org.freeone.android.meeting.room.client.model.PersonItemViewModel;
import org.freeone.android.meeting.room.client.view.MySurfaceViewRenderer;
import org.json.JSONException;
import org.json.JSONObject;
import org.mediasoup.droid.Consumer;
import org.webrtc.EglRenderer;
import org.webrtc.RendererCommon;
import org.webrtc.VideoTrack;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PeerAdapter extends RecyclerView.Adapter<PeerAdapter.PeerViewHolder> {

    private static final String TAG = "PeerAdapter";

    Context mContext;

    private List<PersonItemViewModel> list = new ArrayList<>();

    private Map<String,PersonItemViewModel> consumerBelongTo = new HashMap<>();

    Handler notifyInsertHandler = new Handler() {
        @Override
        public void handleMessage(@NonNull Message msg) {
            super.handleMessage(msg);
            JSONObject jsonObject = (JSONObject) msg.obj;
            String socketId = jsonObject.optString("socketId");
            Consumer consumer = (Consumer) jsonObject.opt("consumer");
            String nickname = jsonObject.optString("nickname");

            int index = -1;
            for (int i = 0; i < list.size(); i++) {
                PersonItemViewModel personItemViewModel = list.get(i);
                if(socketId.equals(personItemViewModel.getSocketId())){
                    index = i;
                    break;
                }
            }
            Log.e(TAG, "handleMessage: PeerAdapter notifyItemInserted index = "+index );
            if (index != -1){
                PersonItemViewModel personItemViewModel = list.get(index);
                personItemViewModel.addNewConsumer(consumer);
                MySurfaceViewRenderer surfaceViewRenderer = personItemViewModel.getSurfaceViewRenderer();
                String kind = consumer.getKind();
                if ("video".equals(kind)) {
                    VideoTrack videoTrack = (VideoTrack) consumer.getTrack();
                    videoTrack.addSink(surfaceViewRenderer);
                    surfaceViewRenderer.setVisibility(View.VISIBLE);

                }else if ("audio".equals(kind)){
                    // TODO 音频怎么处理

                }

                consumerBelongTo.put(consumer.getId(),list.get(index));
            }else{
                PersonItemViewModel personItemViewModel = new PersonItemViewModel();
                personItemViewModel.setSocketId(socketId);
                personItemViewModel.setNickname(nickname);
                personItemViewModel.getConsumerList().add(consumer);
                list.add(personItemViewModel);
                consumerBelongTo.put(consumer.getId(),personItemViewModel);
                notifyItemInserted(getItemCount() - 1);
                notifyItemChanged(getItemCount());
            }
            Log.d(TAG, "handleMessage: PeerAdapter notifyItemInserted");

        }
    };
    Handler notifyRemoveHandler = new Handler() {
        @Override
        public void handleMessage(@NonNull Message msg) {
            super.handleMessage(msg);
            Log.d(TAG, "handleMessage: PeerAdapter notifyRemoveHandler");
            notifyItemRemoved((Integer) msg.obj);
            notifyItemChanged(getItemCount());
        }
    };

    Handler surfaceViewRendererReSizeHandler = new Handler(){
        @Override
        public void handleMessage(@NonNull Message msg) {
            Log.d(TAG, "handleMessage: surfaceViewRendererReSizeHandler" );
            super.handleMessage(msg);
             JSONObject jsonObject = (JSONObject) msg.obj;
            MySurfaceViewRenderer surfaceViewRenderer = (MySurfaceViewRenderer) jsonObject.opt("surfaceViewRenderer");
            int width = jsonObject.optInt("width");
            int height = jsonObject.optInt("height");
            ViewGroup.LayoutParams layoutParams = surfaceViewRenderer.getLayoutParams();
            int originWidth = surfaceViewRenderer.getWidth();
            float radio = Float.parseFloat(width+"") / Float.parseFloat(originWidth+"");
            surfaceViewRenderer.getEglRenderer().setLayoutAspectRatio(radio);
            int newHeight = (int) (height/radio);
            layoutParams.width = originWidth;
            layoutParams.height = newHeight;
            Log.e(TAG, String.format("setLayoutParams %d %d ",layoutParams.width,layoutParams.height ) );
            surfaceViewRenderer.setLayoutParams(layoutParams);
        }
    };

    public PeerAdapter(Context mContext) {
        this.mContext = mContext;
    }

    @NonNull
    @Override
    public PeerViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        Log.d(TAG, "onCreateViewHolder: ");
        Context context = parent.getContext();
        View view = LayoutInflater.from(context).inflate(R.layout.layout_remote_item, parent, false);
        return new PeerViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull PeerViewHolder holder, int position) {
        Log.e(TAG, "onBindViewHolder: ");
        PersonItemViewModel consumerItemViewModel = list.get(position);
        holder.initSurfaceViewRenderer(consumerItemViewModel);
        ViewGroup.LayoutParams layoutParams = holder.surfaceViewRenderer.getLayoutParams();
        layoutParams.width = ViewGroup.LayoutParams.MATCH_PARENT;
        layoutParams.height = ViewGroup.LayoutParams.WRAP_CONTENT;
        holder.surfaceViewRenderer.setLayoutParams(layoutParams);
        holder.surfaceViewRenderer.setOnClickListener(v -> {
            ViewGroup.LayoutParams surfaceViewlayoutParams = holder.surfaceViewRenderer.getLayoutParams();
            surfaceViewlayoutParams.height = holder.surfaceViewRenderer.getHeight()+1;
            holder.surfaceViewRenderer.setLayoutParams(surfaceViewlayoutParams);
        });
    }

    /**
     * 添加消费
     * @param socketId 这个消费是谁生产的就是谁的id
     * @param consumer 一个消费
     * @param nickname 昵称
     */
    public void addConsumerItemViewModel(@NonNull String socketId, Consumer consumer, String nickname) {
        Log.e(TAG, "addConsumerItemViewModel: start" );
        try {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("socketId",socketId);
            jsonObject.put( "consumer",consumer);
            jsonObject.put("nickname",nickname);

            Message message = new Message();
            message.obj = jsonObject;
            message.what = 1;
            notifyInsertHandler.sendMessage(message);
            Log.e(TAG, "AddConsumerItemViewModel: end");
        } catch (JSONException e) {
            e.printStackTrace();
        }


    }


    Handler removeConsumerByConsumerIdHandler = new Handler(){
        @Override
        public void handleMessage(@NonNull Message msg) {
            super.handleMessage(msg);
            String consumerId = (String) msg.obj;
            Log.e(TAG, "removeConsumerByConsumerId: consumerId = "+consumerId );
            PersonItemViewModel personItemViewModel = consumerBelongTo.get(consumerId);

            if(personItemViewModel != null){
                MySurfaceViewRenderer surfaceViewRenderer = personItemViewModel.getSurfaceViewRenderer();
                List<Consumer> consumerList = personItemViewModel.getConsumerList();
                for (int i = 0; i < consumerList.size(); i++) {
                    Consumer consumer = consumerList.get(i);
                    if(consumer.getId().equals(consumerId)){
                        String kind = consumer.getKind();
                        if ("video".equals(kind)){
                            VideoTrack videoTrack = (VideoTrack) consumer.getTrack();
                            videoTrack.removeSink(surfaceViewRenderer);
                            videoTrack.dispose();

                            surfaceViewRenderer.clearImage();
//                            surfaceViewRenderer.setVisibility(View.GONE);
                        }

                        break;
                    }
                }
            }
        }
    };
    /**
     *
     * @param consumerId
     */
    public void removeConsumerByConsumerId(String consumerId) {

        Message message = new Message();
        message.obj = consumerId;
        message.what =1 ;
        removeConsumerByConsumerIdHandler.sendMessage(message);
    }


    Handler removePersonBySocketId = new Handler(){
        @Override
        public void handleMessage(@NonNull Message msg) {
            super.handleMessage(msg);
            String socketId = (String) msg.obj;
            int index = -1;
            for (int i = 0; i < list.size(); i++) {
                PersonItemViewModel personItemViewModel = list.get(i);
                if (socketId.equals(personItemViewModel.getSocketId())){
                    index = i;
                    List<Consumer> consumerList = personItemViewModel.getConsumerList();
                    for (Consumer consumer : consumerList) {
                        String kind = consumer.getKind();
                        if ("video".equals(kind)){
                            VideoTrack videoTrack = (VideoTrack) consumer.getTrack();
                            MySurfaceViewRenderer surfaceViewRenderer = personItemViewModel.getSurfaceViewRenderer();
                            videoTrack.removeSink(surfaceViewRenderer);

                            try {
                                surfaceViewRenderer.release();
                            } catch (Exception e) {
                                System.err.println("release error");
                            }
                            surfaceViewRenderer.setVisibility(View.GONE);
                            try {
                                consumer.close();
                            } catch (Exception e) {
                                System.err.println("close error");
                            }

                        }
                    }


                    break;
                }
            }
            if (index != -1){
                list.remove(index);
                Message message = new Message();
                message.obj = index;
                message.what = 1;
                notifyRemoveHandler.sendMessage(message);

            }
        }
    };
    /**
     * 移除人员
     * @param socketId
     */
    public void removePersonBySocketId(String socketId){
        Message message1 = new Message();
        message1.obj = socketId;
        message1.what = 1;
        removePersonBySocketId.sendMessage(message1);


    }
    @Override
    public int getItemCount() {
        return list.size();
    }

    /**
     * 一人一个
     */
    public class PeerViewHolder extends RecyclerView.ViewHolder {

        RelativeLayout remoteItemRelativeLayout;
        FrameLayout frameLayout;
        PersonItemViewModel personItemViewModel;
        MySurfaceViewRenderer surfaceViewRenderer;
        PeerViewHolder(@NonNull View view) {
            super(view);
            frameLayout = view.findViewById(R.id.remote_item_framelayout);
            remoteItemRelativeLayout = view.findViewById(R.id.remote_item_relativeLayout);
        }

        @SuppressLint("ResourceType")
        public void initSurfaceViewRenderer(PersonItemViewModel model) {
            try {
                Log.e(TAG, "initSurfaceViewRenderer: ");
                personItemViewModel = model;

                surfaceViewRenderer = new MySurfaceViewRenderer(mContext);
                surfaceViewRenderer.setId(R.id.remote_item_surfaceViewRender);

                surfaceViewRenderer.addFrameListener(new EglRenderer.FrameListener() {
                    @Override
                    public void onFrame(Bitmap bitmap) {
                        Log.e(TAG, "onFrame: " );

                    }
                },0.75F);
                surfaceViewRenderer.init(PeerConnectionUtils.getEglContext(), new RendererCommon.RendererEvents() {
                    @Override
                    public void onFirstFrameRendered() {
                        Log.e(TAG, "onFirstFrameRendered: " );
                        SurfaceHolder surfaceHolder = surfaceViewRenderer.getHolder();
                        Rect surfaceFrame = surfaceHolder.getSurfaceFrame();
                        Log.e(TAG, String.format("onBindViewHolder: surfaceFrame = %d %d ",surfaceFrame.width(),surfaceFrame.height()  ));
                    }

                    @Override
                    public void onFrameResolutionChanged(int width, int height, int rotation) {
                        Log.e(TAG, String.format("onFrameResolutionChanged: i = %d ,i1 = %d ,i2 = %d ",width,height,rotation ) );
                        try {
                            Message message = new Message();
                            JSONObject jsonObject = new JSONObject();
                            jsonObject.put("surfaceViewRenderer",surfaceViewRenderer);
                            jsonObject.put("width",width);
                            jsonObject.put("height",height);
                            message.obj = jsonObject;
                            message.what = 1;
                            surfaceViewRendererReSizeHandler.sendMessage(message);
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    }
                });

//                surfaceViewRenderer.setBackground(mContext.getResources().getDrawable(Color.BLUE));
                frameLayout.addView(surfaceViewRenderer);
                List<Consumer> consumerList = personItemViewModel.getConsumerList();
                for (int i = 0; i < consumerList.size(); i++) {
                    Consumer consumer = consumerList.get(i);
                    String kind = consumer.getKind();
                    if ("video".equals(kind)) {
                        VideoTrack videoTrack = (VideoTrack) consumer.getTrack();
                        videoTrack.addSink(surfaceViewRenderer);
                        surfaceViewRenderer.setVisibility(View.VISIBLE);

                    }else if ("audio".equals(kind)){
                        // TODO 音频怎么处理

                    }
                }

                personItemViewModel.setSurfaceViewRenderer(surfaceViewRenderer);
                personItemViewModel.setIsInit(true);
            } catch (Throwable e) {
                e.printStackTrace();
            }
        }

    }

    public List<PersonItemViewModel> getList() {
        return this.list;
    }

    public void setList(List<PersonItemViewModel> list) {
        this.list = list;
    }
}
