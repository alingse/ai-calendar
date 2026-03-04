# AI Calendar

使用自然语言管理面试日历。

```bash
python bin/ai-calendar.py add "本周三14:00 有前端面试"
python bin/ai-calendar.py add "明天下午3点 面试" --description "准备算法"
python bin/ai-calendar.py add "下周五10:00-11:30 系统设计面试"
```

## 安装

```bash
pip install -r requirements.txt
export OPENAI_API_KEY='your-api-key'
```

## 使用

```bash
# 添加事件（自然语言）
python bin/ai-calendar.py add "<描述>" [--duration <分钟>] [--description <备注>]

# 添加事件（精确时间）
python bin/ai-calendar.py add-time <日期> <开始> <结束> <标题>

# 列出事件
python bin/ai-calendar.py list [日期]

# 删除事件
python bin/ai-calendar.py remove <uid>
```

## 打开日历

直接打开 `index.html`，或运行 `python -m http.server 8080`

## 配置

编辑 `config/calendar.config.json` 修改时区、时间范围等。

## 依赖

- Python 3.8+
- openai>=1.0.0
