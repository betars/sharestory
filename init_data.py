import os
import json
import random
import datetime
import time
import uuid
from faker import Faker
import firebase_admin
from firebase_admin import credentials, firestore, auth
from dotenv import load_dotenv
import requests
from PIL import Image
from io import BytesIO

# 加载环境变量
load_dotenv()

# 初始化 Faker 生成假数据
fake = Faker('zh_CN')

# 初始化 Firebase Admin SDK
cred = credentials.Certificate("green-340dc-firebase-adminsdk-ik8k4-d235648f76.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# 创建测试用户
def create_test_users(num_users=10):
    users = []
    for i in range(num_users):
        try:
            email = f"test_user_{i}@example.com"
            password = "password123"
            print(email)
            # 创建 Firebase Auth 用户
            user = auth.create_user(
                email=email,
                password=password,
                display_name=fake.name(),
                disabled=False
            )
            print(user)
            # 创建用户资料
            user_data = {
                "email": email,
                "nickname": fake.name(),
                "bio": fake.text(max_nb_chars=100),
                "createdAt": firestore.SERVER_TIMESTAMP,
                "isAnonymous": False,
                "avatar": f"https://i.pravatar.cc/150?u={uuid.uuid4()}"
            }
            
            # 存储到 Firestore
            print(user_data)
            db.collection("users").document(user.uid).set(user_data)
            print(user.uid)
            users.append({"uid": user.uid, **user_data})
            print(f"Created user: {email}")
            
        except Exception as e:
            print(f"Error creating user: {e}")
    
    return users

# 创建帖子
def create_posts(users, num_posts=50):
    posts = []
    tags = ["学习", "生活", "情感", "吐槽", "求助", "分享", "校园", "职场", "娱乐", "科技"]
    
    for _ in range(num_posts):
        try:
            # 随机选择一个用户
            user = random.choice(users)
            
            # 随机决定是否匿名
            is_anonymous = random.choice([True, False])
            
            # 随机生成 1-3 张图片
            image_count = random.randint(0, 3)
            image_urls = []
            
            if image_count > 0:
                for _ in range(image_count):
                    # 使用 Unsplash 随机图片
                    width = random.randint(800, 1200)
                    height = random.randint(600, 800)
                    image_urls.append(f"https://picsum.photos/{width}/{height}?random={uuid.uuid4()}")
            
            # 随机选择 1-3 个标签
            post_tags = random.sample(tags, random.randint(1, 3))
            
            # 创建帖子数据
            post_data = {
                "content": fake.paragraph(nb_sentences=random.randint(3, 8)),
                "imageUrls": image_urls,
                "tags": post_tags,
                "visibility": random.choice(["public", "followers", "private"]),
                "isAnonymous": is_anonymous,
                "authorId": user["uid"],
                "authorName": "匿名用户" if is_anonymous else user["nickname"],
                "createdAt": firestore.SERVER_TIMESTAMP,
                "updatedAt": firestore.SERVER_TIMESTAMP,
                "likes": random.randint(0, 100),
                "comments": random.randint(0, 30),
                "shares": random.randint(0, 10)
            }
            
            # 存储到 Firestore
            post_ref = db.collection("posts").document()
            post_ref.set(post_data)
            
            post_id = post_ref.id
            posts.append({"id": post_id, **post_data})
            print(f"Created post: {post_id}")
            
            # 为帖子创建一些评论
            create_comments(post_id, users, random.randint(0, 10))
            
            # 为帖子创建一些点赞
            create_likes(post_id, users, random.randint(0, 20))
            
            # 避免请求过快
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Error creating post: {e}")
    
    return posts

# 创建评论
def create_comments(post_id, users, num_comments):
    for _ in range(num_comments):
        try:
            # 随机选择一个用户
            user = random.choice(users)
            
            # 随机决定是否匿名
            is_anonymous = random.choice([True, False])
            
            # 创建评论数据
            comment_data = {
                "content": fake.paragraph(nb_sentences=random.randint(1, 3)),
                "postId": post_id,
                "parentId": None,  # 顶级评论
                "authorId": user["uid"],
                "authorName": "匿名用户" if is_anonymous else user["nickname"],
                "isAnonymous": is_anonymous,
                "createdAt": firestore.SERVER_TIMESTAMP,
                "likes": random.randint(0, 15)
            }
            
            # 存储到 Firestore
            comment_ref = db.collection("comments").document()
            comment_ref.set(comment_data)
            
            # 更新帖子的评论计数
            post_ref = db.collection("posts").document(post_id)
            post_ref.update({"comments": firestore.Increment(1)})
            
            print(f"Created comment for post: {post_id}")
            
        except Exception as e:
            print(f"Error creating comment: {e}")

# 创建点赞
def create_likes(post_id, users, num_likes):
    for _ in range(min(num_likes, len(users))):
        try:
            # 随机选择一个用户（确保不重复）
            user = users.pop(random.randint(0, len(users) - 1))
            
            # 创建点赞数据
            like_data = {
                "userId": user["uid"],
                "postId": post_id,
                "createdAt": firestore.SERVER_TIMESTAMP
            }
            
            # 存储到 Firestore
            like_ref = db.collection("likes").document(f"{user['uid']}_{post_id}")
            like_ref.set(like_data)
            
            print(f"Created like for post: {post_id}")
            
        except Exception as e:
            print(f"Error creating like: {e}")

# 创建圈子
def create_circles(users, num_circles=5):
    circles = []
    circle_categories = ["学习", "兴趣", "校园", "职场", "生活", "情感", "游戏", "音乐", "电影", "旅行"]
    
    for i in range(num_circles):
        try:
            # 随机选择一个创建者
            creator = random.choice(users)
            
            # 随机选择一个分类
            category = random.choice(circle_categories)
            
            # 创建圈子数据
            circle_data = {
                "name": f"{category}圈-{fake.word()}",
                "description": fake.text(max_nb_chars=200),
                "category": category,
                "creatorId": creator["uid"],
                "createdAt": firestore.SERVER_TIMESTAMP,
                "memberCount": random.randint(5, 50),
                "isPrivate": random.choice([True, False]),
                "coverImage": f"https://picsum.photos/800/300?random={uuid.uuid4()}"
            }
            
            # 存储到 Firestore
            circle_ref = db.collection("circles").document()
            circle_ref.set(circle_data)
            
            circle_id = circle_ref.id
            circles.append({"id": circle_id, **circle_data})
            print(f"Created circle: {circle_id}")
            
            # 添加一些成员
            add_circle_members(circle_id, users, random.randint(5, min(20, len(users))))
            
        except Exception as e:
            print(f"Error creating circle: {e}")
    
    return circles

# 添加圈子成员
def add_circle_members(circle_id, users, num_members):
    # 随机选择一些用户作为成员
    members = random.sample(users, num_members)
    
    for user in members:
        try:
            # 创建成员数据
            member_data = {
                "userId": user["uid"],
                "circleId": circle_id,
                "joinedAt": firestore.SERVER_TIMESTAMP,
                "role": random.choice(["member", "admin", "member", "member"])  # 大多数是普通成员
            }
            
            # 存储到 Firestore
            db.collection("circleMembers").document(f"{user['uid']}_{circle_id}").set(member_data)
            
            print(f"Added member to circle: {circle_id}")
            
        except Exception as e:
            print(f"Error adding circle member: {e}")

# 创建求助帖子
def create_help_posts(users, num_help_posts=20):
    help_categories = ["学习", "生活", "情感", "技术", "职场", "健康", "法律", "财务"]
    
    for _ in range(num_help_posts):
        try:
            # 随机选择一个用户
            user = random.choice(users)
            
            # 随机决定是否匿名
            is_anonymous = random.choice([True, False])
            
            # 随机选择一个分类
            category = random.choice(help_categories)
            
            # 创建求助帖子数据
            help_data = {
                "title": fake.sentence(nb_words=6),
                "content": fake.text(max_nb_chars=500),
                "category": category,
                "authorId": user["uid"],
                "authorName": "匿名用户" if is_anonymous else user["nickname"],
                "isAnonymous": is_anonymous,
                "createdAt": firestore.SERVER_TIMESTAMP,
                "updatedAt": firestore.SERVER_TIMESTAMP,
                "solved": random.choice([True, False]),
                "reward": random.randint(0, 100),
                "views": random.randint(10, 200),
                "likes": random.randint(0, 50),
                "comments": 0  # 将通过评论创建更新
            }
            
            # 存储到 Firestore
            help_ref = db.collection("helpPosts").document()
            help_ref.set(help_data)
            
            help_id = help_ref.id
            print(f"Created help post: {help_id}")
            
            # 为求助帖子创建一些评论
            create_help_comments(help_id, users, random.randint(1, 8))
            
        except Exception as e:
            print(f"Error creating help post: {e}")

# 创建求助评论
def create_help_comments(help_id, users, num_comments):
    for _ in range(num_comments):
        try:
            # 随机选择一个用户
            user = random.choice(users)
            
            # 随机决定是否匿名
            is_anonymous = random.choice([True, False])
            
            # 创建评论数据
            comment_data = {
                "content": fake.paragraph(nb_sentences=random.randint(1, 4)),
                "helpId": help_id,
                "authorId": user["uid"],
                "authorName": "匿名用户" if is_anonymous else user["nickname"],
                "isAnonymous": is_anonymous,
                "createdAt": firestore.SERVER_TIMESTAMP,
                "likes": random.randint(0, 10),
                "isAnswer": random.choice([True, False])
            }
            
            # 存储到 Firestore
            comment_ref = db.collection("helpComments").document()
            comment_ref.set(comment_data)
            
            # 更新求助帖子的评论计数
            help_ref = db.collection("helpPosts").document(help_id)
            help_ref.update({"comments": firestore.Increment(1)})
            
            print(f"Created comment for help post: {help_id}")
            
        except Exception as e:
            print(f"Error creating help comment: {e}")

# 主函数
def main():
    print("开始导入数据...")
    
    # 创建测试用户
    users = create_test_users(3)
    print(users)
    # 创建帖子
    posts = create_posts(users, 10)
    print(posts)
    # 创建圈子
    circles = create_circles(users, 8)
    print(circles)
    # 创建求助帖子
    help_posts = create_help_posts(users, 10)
    print(help_posts)
    
    print("数据导入完成！")

if __name__ == "__main__":
    main()