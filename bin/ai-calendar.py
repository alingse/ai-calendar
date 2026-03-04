#!/usr/bin/env python3
"""
AI Calendar CLI - 支持自然语言的日历事件管理工具

用法:
    python bin/ai-calendar.py add "本周三14:00 有前端面试" [--duration 60] [--description "备注信息"]
    python bin/ai-calendar.py add-time 2025-03-10 14:00 15:00 "面试标题" [--description "备注"]
    python bin/ai-calendar.py list [日期]
    python bin/ai-calendar.py remove <uid>
    python bin/ai-calendar.py init
"""

import os
import sys
import json
import argparse
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Tuple
from urllib.parse import urlparse

# ICS 相关工具
try:
    import uuid
except ImportError:
    pass


# ============ 配置 ============
CONFIG_PATH = Path(__file__).parent.parent / "config" / "calendar.config.json"
DATA_DIR = Path(__file__).parent.parent / "data"
EVENTS_FILE = DATA_DIR / "events.ics"


def load_config() -> dict:
    """加载配置文件"""
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "calendar": {
            "name": "Interview Calendar",
            "description": "Available time slots for interviews",
            "timezone": "Asia/Shanghai"
        },
        "data": {"eventsFile": "data/events.ics"}
    }


# ============ LLM 相关 ============
def get_llm_client():
    """获取 LLM 客户端"""
    api_key = os.environ.get("OPENAI_API_KEY")
    api_base = os.environ.get("OPENAI_API_BASE", "https://api.openai.com/v1")
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    
    if not api_key:
        print("错误: 请设置 OPENAI_API_KEY 环境变量")
        print("示例: export OPENAI_API_KEY='your-api-key'")
        sys.exit(1)
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url=api_base)
        return client, model
    except ImportError:
        print("错误: 请先安装 openai 库")
        print("运行: pip install openai")
        sys.exit(1)


def parse_natural_language(text: str) -> Optional[dict]:
    """使用 LLM 解析自然语言时间为结构化数据"""
    client, model = get_llm_client()
    
    # 获取当前时间作为参考
    now = datetime.now()
    current_date = now.strftime("%Y-%m-%d")
    current_weekday = now.weekday()  # 0=Monday
    
    prompt = f"""你是一个日期时间解析助手。请将用户的自然语言描述解析为日历事件信息。

当前日期: {current_date} (今天)
当前星期: {['周一', '周二', '周三', '周四', '周五', '周六', '周日'][current_weekday]}

用户输入: {text}

请解析并返回 JSON 格式的结果:
{{
    "title": "事件标题",
    "date": "YYYY-MM-DD 格式的日期",
    "start_time": "HH:MM 格式的时间",
    "end_time": "HH:MM 格式的时间",
    "description": "事件描述/备注（如果有）",
    "confidence": "high/medium/low"
}}

规则:
1. 相对时间解析:
   - "今天" = {current_date}
   - "明天" = {(now + timedelta(days=1)).strftime("%Y-%m-%d")}
   - "后天" = {(now + timedelta(days=2)).strftime("%Y-%m-%d")}
   - "本周X" = 本周的某一天
   - "下周X" = 下一周的某一天
   - "下周" = 下周的同一天
   
2. 时间解析:
   - "14点", "14:00", "下午2点" 都应该解析为 14:00
   - 如果只给开始时间，默认持续 60 分钟
   - "X点半" = X:30
   
3. 标题提取:
   - 从文本中提取事件的核心描述作为标题
   - 去掉时间相关的词汇

4. 备注处理:
   - 对于会议邀请类信息（如 WPS 会议、腾讯会议等模板化邀请），备注应保持简洁
   - 只保留真正有用的信息（如会议链接、密码），去掉冗余的邀请语
   - 如果备注内容主要是重复标题或包含大量模板化客套话，建议留空

请只返回 JSON，不要包含其他内容。"""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "你是一个专业的日期时间解析助手。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # 提取 JSON 部分
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
        
        import json as json_module
        result = json_module.loads(result_text)
        
        if result.get("confidence") == "low":
            print(f"警告: 置信度较低，解析结果可能不准确")
            print(f"解析结果: {result}")
            confirm = input("是否继续? (y/N): ")
            if confirm.lower() != "y":
                return None
        
        return result
        
    except Exception as e:
        print(f"LLM 解析错误: {e}")
        return None


# ============ ICS 文件操作 ============
def format_ics_datetime(dt: datetime) -> str:
    """格式化为 ICS 日期时间格式"""
    return dt.strftime("%Y%m%dT%H%M%S")


def parse_ics_datetime(ics_str: str) -> datetime:
    """解析 ICS 日期时间字符串"""
    # 处理 20250310T140000 格式
    if len(ics_str) >= 15:
        year = int(ics_str[0:4])
        month = int(ics_str[4:6])
        day = int(ics_str[6:8])
        hour = int(ics_str[9:11])
        minute = int(ics_str[11:13])
        return datetime(year, month, day, hour, minute)
    raise ValueError(f"无法解析 ICS 日期时间: {ics_str}")


def read_ics_file() -> str:
    """读取 ICS 文件内容"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    if not EVENTS_FILE.exists():
        # 创建初始文件
        config = load_config()
        content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Calendar//CN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:{config['calendar']['name']}
X-WR-TIMEZONE:{config['calendar']['timezone']}
X-WR-CALDESC:{config['calendar']['description']}
END:VCALENDAR"""
        EVENTS_FILE.write_text(content, encoding="utf-8")
    
    return EVENTS_FILE.read_text(encoding="utf-8")


def write_ics_file(content: str):
    """写入 ICS 文件"""
    EVENTS_FILE.write_text(content, encoding="utf-8")


def generate_uid(start_dt: datetime) -> str:
    """生成唯一 UID"""
    timestamp = format_ics_datetime(datetime.now())
    random_part = uuid.uuid4().hex[:8]
    return f"{timestamp}-{random_part}@ai-calendar.local"


def add_event_to_ics(title: str, start_dt: datetime, end_dt: datetime, description: str = ""):
    """添加事件到 ICS 文件"""
    ics_content = read_ics_file()
    
    uid = generate_uid(start_dt)
    now = datetime.now()
    
    # 构建 VEVENT
    vevent_lines = [
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{format_ics_datetime(now)}",
        f"DTSTART:{format_ics_datetime(start_dt)}",
        f"DTEND:{format_ics_datetime(end_dt)}",
        f"SUMMARY:{title}",
    ]
    
    if description:
        vevent_lines.append(f"DESCRIPTION:{description}")
    
    vevent_lines.append("END:VEVENT")
    vevent = "\n".join(vevent_lines)
    
    # 插入到 END:VCALENDAR 之前
    updated_content = ics_content.replace("END:VCALENDAR", vevent + "\nEND:VCALENDAR")
    write_ics_file(updated_content)
    
    return {
        "uid": uid,
        "title": title,
        "date": start_dt.strftime("%Y-%m-%d"),
        "start_time": start_dt.strftime("%H:%M"),
        "end_time": end_dt.strftime("%H:%M"),
        "description": description
    }


def list_events(date_str: Optional[str] = None) -> list:
    """列出事件"""
    ics_content = read_ics_file()
    events = []
    
    # 解析事件
    lines = ics_content.split("\n")
    current_event = None
    in_event = False
    
    for line in lines:
        line = line.strip()
        if line == "BEGIN:VEVENT":
            in_event = True
            current_event = {}
        elif line == "END:VEVENT":
            if current_event and "dtstart" in current_event:
                events.append(current_event)
            in_event = False
            current_event = None
        elif in_event and current_event is not None:
            if line.startswith("UID:"):
                current_event["uid"] = line[4:]
            elif line.startswith("DTSTART"):
                dt_str = line.split(":", 1)[1]
                current_event["dtstart"] = parse_ics_datetime(dt_str)
            elif line.startswith("DTEND"):
                dt_str = line.split(":", 1)[1]
                current_event["dtend"] = parse_ics_datetime(dt_str)
            elif line.startswith("SUMMARY:"):
                current_event["summary"] = line[8:]
            elif line.startswith("DESCRIPTION:"):
                current_event["description"] = line[12:]
    
    # 按日期筛选
    if date_str:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        events = [e for e in events if e["dtstart"].date() == target_date]
    
    # 按开始时间排序
    events.sort(key=lambda x: x["dtstart"])
    
    return events


def remove_event_by_uid(uid: str) -> bool:
    """根据 UID 删除事件"""
    ics_content = read_ics_file()
    lines = ics_content.split("\n")
    
    output_lines = []
    in_event = False
    skip_event = False
    event_uid = None
    removed = False
    
    for line in lines:
        stripped = line.strip()
        
        if stripped == "BEGIN:VEVENT":
            in_event = True
            skip_event = False
            event_uid = None
        elif stripped == "END:VEVENT":
            if event_uid == uid:
                skip_event = True
                removed = True
            if not skip_event:
                output_lines.append(line)
            in_event = False
            event_uid = None
            continue
        elif in_event:
            if stripped.startswith("UID:"):
                event_uid = stripped[4:]
            if event_uid == uid:
                skip_event = True
        
        if not skip_event:
            output_lines.append(line)
    
    if removed:
        write_ics_file("\n".join(output_lines))
    
    return removed


# ============ 命令处理 ============
def cmd_add(args):
    """使用自然语言添加事件"""
    text = args.text
    duration = args.duration or 60  # 默认 60 分钟
    description = args.description or ""
    
    print(f"🤖 正在解析: \"{text}\" ...")
    
    result = parse_natural_language(text)
    if not result:
        print("❌ 无法解析自然语言描述")
        sys.exit(1)
    
    # 构建日期时间
    date_str = result.get("date")
    start_time_str = result.get("start_time")
    end_time_str = result.get("end_time")
    title = result.get("title", "未命名事件")
    
    # 备注只使用用户显式传入的，忽略 LLM 解析的 description
    # 这样只有用户特别标注备注时才会添加
    
    # 解析时间
    start_dt = datetime.strptime(f"{date_str} {start_time_str}", "%Y-%m-%d %H:%M")
    
    if end_time_str:
        end_dt = datetime.strptime(f"{date_str} {end_time_str}", "%Y-%m-%d %H:%M")
    else:
        end_dt = start_dt + timedelta(minutes=duration)
    
    # 添加事件
    event_info = add_event_to_ics(title, start_dt, end_dt, description)
    
    print("✅ 事件添加成功!")
    print(f"   标题: {event_info['title']}")
    print(f"   日期: {event_info['date']}")
    print(f"   时间: {event_info['start_time']} - {event_info['end_time']}")
    if description:
        print(f"   备注: {description}")
    print(f"   UID: {event_info['uid']}")


def cmd_add_time(args):
    """使用精确参数添加事件"""
    date_str = args.date
    start_time = args.start
    end_time = args.end
    title = args.title
    description = args.description or ""
    
    # 解析日期时间
    start_dt = datetime.strptime(f"{date_str} {start_time}", "%Y-%m-%d %H:%M")
    end_dt = datetime.strptime(f"{date_str} {end_time}", "%Y-%m-%d %H:%M")
    
    if end_dt <= start_dt:
        print("❌ 错误: 结束时间必须晚于开始时间")
        sys.exit(1)
    
    event_info = add_event_to_ics(title, start_dt, end_dt, description)
    
    print("✅ 事件添加成功!")
    print(f"   标题: {event_info['title']}")
    print(f"   日期: {event_info['date']}")
    print(f"   时间: {event_info['start_time']} - {event_info['end_time']}")
    if description:
        print(f"   备注: {description}")
    print(f"   UID: {event_info['uid']}")


def cmd_list(args):
    """列出事件"""
    date_str = args.date
    
    events = list_events(date_str)
    
    if date_str:
        print(f"📅 {date_str} 的事件:")
    else:
        print("📅 所有事件:")
    
    print()
    
    if not events:
        print("   没有找到事件")
    else:
        for i, event in enumerate(events, 1):
            date = event["dtstart"].strftime("%Y-%m-%d")
            start = event["dtstart"].strftime("%H:%M")
            end = event["dtend"].strftime("%H:%M")
            summary = event.get("summary", "未命名")
            uid = event.get("uid", "未知")
            
            print(f"{i}. {summary}")
            print(f"   日期: {date}")
            print(f"   时间: {start} - {end}")
            if event.get("description"):
                print(f"   备注: {event['description']}")
            print(f"   UID: {uid}")
            print()


def cmd_remove(args):
    """删除事件"""
    uid = args.uid
    
    if remove_event_by_uid(uid):
        print(f"✅ 事件已删除")
        print(f"   UID: {uid}")
    else:
        print(f"❌ 未找到 UID 为 {uid} 的事件")
        print("提示: 使用 'list' 命令查看可用的 UID")


def cmd_init(args):
    """初始化日历"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    # 读取（如果不存在会自动创建）
    read_ics_file()
    
    config = load_config()
    print("✅ AI Calendar 初始化成功!")
    print(f"   数据文件: {EVENTS_FILE}")
    print()
    print("可用命令:")
    print('  python bin/ai-calendar.py add "本周三14:00 有面试"')
    print("  python bin/ai-calendar.py add-time 2025-03-10 14:00 15:00 \"面试\"")
    print("  python bin/ai-calendar.py list [日期]")
    print("  python bin/ai-calendar.py remove <uid>")


def main():
    parser = argparse.ArgumentParser(
        description="AI Calendar CLI - 支持自然语言的日历事件管理工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 使用自然语言添加事件
  python bin/ai-calendar.py add "本周三14:00 有前端面试"
  python bin/ai-calendar.py add "明天下午3点面试，备注：准备简历" --description "带上作品集"
  
  # 使用精确时间添加
  python bin/ai-calendar.py add-time 2025-03-10 14:00 15:00 "面试标题" --description "备注"
  
  # 列出事件
  python bin/ai-calendar.py list
  python bin/ai-calendar.py list 2025-03-10
  
  # 删除事件
  python bin/ai-calendar.py remove <uid>
  
环境变量:
  OPENAI_API_KEY    - OpenAI API 密钥 (必需)
  OPENAI_API_BASE   - OpenAI API 基础 URL (默认: https://api.openai.com/v1)
  OPENAI_MODEL      - 使用的模型 (默认: gpt-4o-mini)
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="可用命令")
    
    # add 命令 - 自然语言
    add_parser = subparsers.add_parser("add", help="使用自然语言添加事件")
    add_parser.add_argument("text", help="自然语言描述，例如'本周三14:00有面试'")
    add_parser.add_argument("--duration", type=int, default=60, help="事件持续时间（分钟）")
    add_parser.add_argument("--description", "-d", help="额外备注")
    add_parser.set_defaults(func=cmd_add)
    
    # add-time 命令 - 精确时间
    add_time_parser = subparsers.add_parser("add-time", help="使用精确时间添加事件")
    add_time_parser.add_argument("date", help="日期 (YYYY-MM-DD)")
    add_time_parser.add_argument("start", help="开始时间 (HH:MM)")
    add_time_parser.add_argument("end", help="结束时间 (HH:MM)")
    add_time_parser.add_argument("title", help="事件标题")
    add_time_parser.add_argument("--description", "-d", help="备注")
    add_time_parser.set_defaults(func=cmd_add_time)
    
    # list 命令
    list_parser = subparsers.add_parser("list", help="列出事件")
    list_parser.add_argument("date", nargs="?", help="日期 (YYYY-MM-DD)，可选")
    list_parser.set_defaults(func=cmd_list)
    
    # remove 命令
    remove_parser = subparsers.add_parser("remove", help="删除事件")
    remove_parser.add_argument("uid", help="事件 UID")
    remove_parser.set_defaults(func=cmd_remove)
    
    # init 命令
    init_parser = subparsers.add_parser("init", help="初始化日历")
    init_parser.set_defaults(func=cmd_init)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        sys.exit(0)
    
    args.func(args)


if __name__ == "__main__":
    main()
