import csv
import json
import sys

# Ensure stdout handles UTF-8
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

csv_path = 'lee_wooyeon_all_videos.csv'

videos = []
with open(csv_path, mode='r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            videos.append({
                'title': row['동영상제목'].strip(),
                'views': int(row['조회수']),
                'likes': int(row['좋아요수']),
                'comments': int(row['댓글수']),
                'date': row['게시일시'].strip(),
                'url': row['동영상링크'].strip(),
                'id': row['동영상ID'].strip()
            })
        except Exception as e:
            print(f"Error parsing row: {e}, row: {row}")

print(f"Total videos parsed: {len(videos)}")

# Summary Statistics
total_views = sum(v['views'] for v in videos)
total_likes = sum(v['likes'] for v in videos)
total_comments = sum(v['comments'] for v in videos)
avg_views = round(total_views / len(videos)) if videos else 0
avg_likes = round(total_likes / len(videos)) if videos else 0
avg_comments = round(total_comments / len(videos)) if videos else 0

stats = {
    'total_videos': len(videos),
    'total_views': total_views,
    'total_likes': total_likes,
    'total_comments': total_comments,
    'avg_views': avg_views,
    'avg_likes': avg_likes,
    'avg_comments': avg_comments
}

# Write JS file for the web app
js_content = f"// Generated from lee_wooyeon_all_videos.csv\nconst STATS_DATA = {json.dumps(stats, ensure_ascii=False, indent=2)};\nconst VIDEOS_DATA = {json.dumps(videos, ensure_ascii=False, indent=2)};"
with open('videos_data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Generated videos_data.js successfully.")

def print_top(category, key_name, unit, n=10):
    sorted_v = sorted(videos, key=lambda x: x[key_name], reverse=True)
    print(f"\n================ TOP {n} BY {category.upper()} ================")
    for idx, v in enumerate(sorted_v[:n], 1):
        print(f"{idx:2d}. [{v[key_name]:,}{unit}] {v['title']}")
        print(f"    - 조회수: {v['views']:,} | 좋아요: {v['likes']:,} | 댓글: {v['comments']:,} | 게시일: {v['date'][:10]}")
        print(f"    - URL: {v['url']}")

print(f"\n[채널 통계 요약]")
print(f"총 영상 수: {len(videos):,}개")
print(f"총 조회수: {total_views:,}회 (영상당 평균: {avg_views:,}회)")
print(f"총 좋아요수: {total_likes:,}개 (영상당 평균: {avg_likes:,}개)")
print(f"총 댓글수: {total_comments:,}개 (영상당 평균: {avg_comments:,}개)")

print_top("조회수 (Views)", "views", "회", 10)
print_top("좋아요수 (Likes)", "likes", "개", 10)
print_top("댓글수 (Comments)", "comments", "개", 10)
