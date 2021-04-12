package org.freeone.android.meeting.room.client.adapter;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Rect;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import org.freeone.android.meeting.room.client.ConsumerItemViewModel;
import org.freeone.android.meeting.room.client.R;
import org.freeone.android.meeting.room.client.lib.PeerConnectionUtils;
import org.freeone.android.meeting.room.client.lib.model.Me;
import org.freeone.android.meeting.room.client.view.MySurfaceViewRenderer;
import org.json.JSONException;
import org.json.JSONObject;
import org.mediasoup.droid.Consumer;
import org.webrtc.EglRenderer;
import org.webrtc.RendererCommon;

import org.webrtc.SurfaceEglRenderer;
import org.webrtc.VideoTrack;


import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class PeerAdapter extends RecyclerView.Adapter<PeerAdapter.PeerViewHolder> {

    private static final String TAG = "PeerAdapter";

    Context mContext;

    private List<ConsumerItemViewModel> list = new ArrayList<>();

    Handler notifyInsertHandler = new Handler() {
        @Override
        public void handleMessage(@NonNull Message msg) {
            super.handleMessage(msg);
            Log.e(TAG, "handleMessage: PeerAdapter notifyItemInserted");
            notifyItemInserted(getItemCount() - 1);
            notifyItemChanged(getItemCount());
        }
    };
    Handler notifyRemoveHandler = new Handler() {
        @Override
        public void handleMessage(@NonNull Message msg) {
            super.handleMessage(msg);
            Log.e(TAG, "handleMessage: PeerAdapter notifyRemoveHandler");
            notifyItemRemoved((Integer) msg.obj);
            notifyItemChanged(getItemCount());
        }
    };

    Handler surfaceViewRendererReSizeHandler = new Handler(){
        @Override
        public void handleMessage(@NonNull Message msg) {
            Log.e(TAG, "handleMessage: surfaceViewRendererReSizeHandler" );
            super.handleMessage(msg);
             JSONObject jsonObject = (JSONObject) msg.obj;

            MySurfaceViewRenderer surfaceViewRenderer = (MySurfaceViewRenderer) jsonObject.opt("surfaceViewRenderer");
            int width = jsonObject.optInt("width");
            int height = jsonObject.optInt("height");

            ViewGroup.LayoutParams layoutParams = surfaceViewRenderer.getLayoutParams();
            Log.e(TAG, "handleMessage: surfaceViewRenderer.getWidth(); = "+surfaceViewRenderer.getWidth() );
            int originWidth = surfaceViewRenderer.getWidth();
            Log.e(TAG, "handleMessage: originWidth = "+originWidth );
            Log.e(TAG, "handleMessage: width = "+width );
            float radio = Float.parseFloat(width+"") / Float.parseFloat(originWidth+"");
            Log.e(TAG, "handleMessage: radio = "+radio );
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
        Log.e(TAG, "onCreateViewHolder: ");

        Context context = parent.getContext();
        View view = LayoutInflater.from(context).inflate(R.layout.layout_remote_item, parent, false);
        return new PeerViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull PeerViewHolder holder, int position) {
        Log.e(TAG, "onBindViewHolder: ");
        ConsumerItemViewModel consumerItemViewModel = list.get(position);
        holder.initSurfaceViewRenderer(consumerItemViewModel);
        ViewGroup.LayoutParams layoutParams = holder.surfaceViewRenderer.getLayoutParams();
        layoutParams.width = ViewGroup.LayoutParams.MATCH_PARENT;
        layoutParams.height = ViewGroup.LayoutParams.WRAP_CONTENT;


        holder.surfaceViewRenderer.setLayoutParams(layoutParams);

        holder.surfaceViewRenderer.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                ViewGroup.LayoutParams layoutParams = holder.surfaceViewRenderer.getLayoutParams();
                layoutParams.height = holder.surfaceViewRenderer.getHeight()+1;
                holder.surfaceViewRenderer.setLayoutParams(layoutParams);
            }
        });
    }

    public void AddConsumerItemViewModel(ConsumerItemViewModel consumerItemViewModel) {
        Log.e(TAG, "AddConsumerItemViewModel: ");
        list.add(consumerItemViewModel);
        notifyInsertHandler.sendEmptyMessage(1);
    }

    public void removeConsumerItemViewModelByConsumerId(String consumerId) {
        for (int i = 0; i < list.size(); i++) {
            ConsumerItemViewModel consumerItemViewModel = list.get(i);
            if (consumerItemViewModel.getConsumer().getId().equals(consumerId)) {
                VideoTrack videoTrack = (VideoTrack) consumerItemViewModel.getConsumer().getTrack();
                MySurfaceViewRenderer surfaceViewRenderer = consumerItemViewModel.getSurfaceViewRenderer();
                videoTrack.removeSink(surfaceViewRenderer);
                videoTrack.dispose();
                surfaceViewRenderer.release();


                list.remove(consumerItemViewModel);
                Message message = new Message();
                message.obj = i;
                message.what = 1;
                notifyRemoveHandler.sendMessage(message);
                break;
            }
        }
        for (ConsumerItemViewModel consumerItemViewModel : list) {
            if (consumerItemViewModel.getConsumer().getId().equals(consumerId)) {
                list.remove(consumerItemViewModel);
                break;
            }
        }
        notifyInsertHandler.sendEmptyMessage(1);
    }

    @Override
    public int getItemCount() {
        return list.size();
    }



    class PeerViewHolder extends RecyclerView.ViewHolder {

        RelativeLayout remoteItemRelativeLayout;
        FrameLayout frameLayout;
        ConsumerItemViewModel consumerItemViewModel;
        MySurfaceViewRenderer surfaceViewRenderer;
        PeerViewHolder(@NonNull View view) {
            super(view);
            frameLayout = view.findViewById(R.id.remote_item_framelayout);
            remoteItemRelativeLayout = view.findViewById(R.id.remote_item_relativeLayout);
        }

        public void initSurfaceViewRenderer(ConsumerItemViewModel model) {
            Log.e(TAG, "initSurfaceViewRenderer: ");
            consumerItemViewModel = model;
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


            frameLayout.addView(surfaceViewRenderer);

            Consumer consumer = consumerItemViewModel.getConsumer();
            String kind = consumer.getKind();

            if ("video".equals(kind)) {
                VideoTrack videoTrack = (VideoTrack) consumer.getTrack();

                Log.e(TAG, "initSurfaceViewRenderer: state = " + videoTrack.state());
                videoTrack.addSink(surfaceViewRenderer);
                consumerItemViewModel.setSurfaceViewRenderer(surfaceViewRenderer);
                Log.e(TAG, "initSurfaceViewRenderer:  videoTrack = " + videoTrack .toString());
            }
        }

    }
}
