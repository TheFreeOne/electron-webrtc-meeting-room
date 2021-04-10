package org.freeone.android.meeting.room.client.adapter;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.LifecycleOwner;
import androidx.recyclerview.widget.RecyclerView;

import org.freeone.android.meeting.room.client.ConsumerItemViewModel;
import org.freeone.android.meeting.room.client.R;
import org.freeone.android.meeting.room.client.lib.PeerConnectionUtils;
import org.mediasoup.droid.Consumer;
import org.mediasoup.droid.Logger;
import org.webrtc.EglRenderer;
import org.webrtc.SurfaceViewRenderer;
import org.webrtc.VideoTrack;


import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

import java.util.logging.LogRecord;

public class PeerAdapter extends RecyclerView.Adapter<PeerAdapter.PeerViewHolder> {

  private static final String TAG = "PeerAdapter";

   Context mContext;
  private int containerHeight;

  private List<ConsumerItemViewModel> list = new ArrayList<>();

  Handler notifyHandler = new Handler() {
    @Override
    public void handleMessage(@NonNull Message msg) {
      super.handleMessage(msg);
      Log.e(TAG, "handleMessage: PeerAdapter notifyItemInserted" );
      notifyItemInserted(getItemCount()-1);
      notifyItemChanged(getItemCount());
    }
  };

  public PeerAdapter(Context mContext) {
    this.mContext = mContext;
  }

  @NonNull
  @Override
  public PeerViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
    Log.e(TAG, "onCreateViewHolder: "  );
    containerHeight = parent.getHeight();
    Context context = parent.getContext();
    View view = LayoutInflater.from(context).inflate(R.layout.layout_remote_item, parent, false);
    return new PeerViewHolder(view);
  }

  @Override
  public void onBindViewHolder(@NonNull PeerViewHolder holder, int position) {
    Log.e(TAG, "onBindViewHolder: " );
    ConsumerItemViewModel consumerItemViewModel = list.get(position);
    holder.initSurfaceViewRenderer(consumerItemViewModel);
    // update height
    ViewGroup.LayoutParams layoutParams = holder.remoteItemRelativeLayout.getLayoutParams();
    layoutParams.height = getItemHeight();
    holder.remoteItemRelativeLayout.setLayoutParams(layoutParams);
//    // bind


  }

  public void AddConsumerItemViewModel(ConsumerItemViewModel consumerItemViewModel){
    Log.e(TAG, "AddConsumerItemViewModel: " );
    list.add(consumerItemViewModel);
    notifyHandler.sendEmptyMessage(1);
  }

  @Override
  public int getItemCount() {
    return list.size();
  }

  private int getItemHeight() {
    int itemCount = getItemCount();
    if (itemCount <= 1) {
      return containerHeight;
    } else if (itemCount <= 3) {
      return containerHeight / itemCount;
    } else {
      return (int) (containerHeight / 3.2);
    }
  }

  class PeerViewHolder extends RecyclerView.ViewHolder {

    RelativeLayout remoteItemRelativeLayout;
    FrameLayout frameLayout ;
    ConsumerItemViewModel consumerItemViewModel;
    PeerViewHolder(@NonNull View view) {
      super(view);
      frameLayout = view.findViewById(R.id.remote_item_framelayout);
      remoteItemRelativeLayout = view.findViewById(R.id.remote_item_relativeLayout);
    }

    public void initSurfaceViewRenderer(ConsumerItemViewModel model){
      Log.e(TAG, "initSurfaceViewRenderer: " );
      consumerItemViewModel = model;
      SurfaceViewRenderer surfaceViewRenderer = new SurfaceViewRenderer(mContext);
      surfaceViewRenderer.setId(R.id.remote_item_surfaceViewRender);
      surfaceViewRenderer.s
      surfaceViewRenderer.init(PeerConnectionUtils.getEglContext(),null);
      frameLayout.addView(surfaceViewRenderer);
      surfaceViewRenderer.addFrameListener(bitmap -> Log.e(TAG, "surfaceViewRenderer onFrame: " ),0.5F);
      Consumer consumer = consumerItemViewModel.getConsumer();
      String kind = consumer.getKind();
      if ("video".equals(kind)){
        VideoTrack videoTrack = (VideoTrack) consumer.getTrack();
        videoTrack.addSink(surfaceViewRenderer);
      }
    }

  }
}
