/*
 Navicat Premium Data Transfer

 Source Server         : MySQL
 Source Server Type    : MySQL
 Source Server Version : 80019
 Source Host           : localhost:3306
 Source Schema         : electron_webrtc_meeting_room

 Target Server Type    : MySQL
 Target Server Version : 80019
 File Encoding         : 65001

 Date: 30/01/2021 17:06:14
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for tb_user
-- ----------------------------
DROP TABLE IF EXISTS `tb_user`;
CREATE TABLE `tb_user`  (
  `id` varchar(32) CHARACTER SET utf8mb4   NOT NULL COMMENT '主键',
  `username` varchar(20) CHARACTER SET utf8mb4   NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4   NULL DEFAULT NULL,
  `nickname` varchar(20) CHARACTER SET utf8mb4   NULL DEFAULT NULL,
  `create_time` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4   ROW_FORMAT = Dynamic;

INSERT INTO `tb_user` VALUES ('1', '1', '1', '1', '2021-04-02 16:05:14');
INSERT INTO `tb_user` VALUES ('2', '2', '2', '2', '2021-04-02 16:05:25');

SET FOREIGN_KEY_CHECKS = 1;
