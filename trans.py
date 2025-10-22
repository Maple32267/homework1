#!/usr/bin/env python3
import json
import subprocess
import os
from collections import defaultdict

def get_hadoop_results():
    """从Hadoop获取词频统计结果"""
    try:
        # 执行hadoop命令获取结果
        result = subprocess.run(
            "hdfs dfs -cat /user/wordcount/output/part-r-00000",
            shell=True,
            capture_output=True,
            text=True,
            check=True
        )
        
        # 解析结果
        word_counts = []
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                parts = line.split('\t')
                if len(parts) >= 2:
                    word, count = parts[0].strip(), parts[1].strip()
                    try:
                        word_counts.append({
                            'word': word,
                            'count': int(count)
                        })
                    except ValueError:
                        continue  # 跳过无法解析的行
        
        # 按词频排序
        word_counts.sort(key=lambda x: x['count'], reverse=True)
        return word_counts
        
    except Exception as e:
        print(f"获取Hadoop结果失败: {e}")
        return []

def save_as_json(data, filename="data/wordcount.json"):
    """保存为JSON文件"""
    # 确保目录存在
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"数据已保存到 {filename}，共 {len(data)} 条记录")

if __name__ == "__main__":
    print("正在从Hadoop获取词频统计结果...")
    results = get_hadoop_results()
    
    if results:
        save_as_json(results)
        print("转换完成！")
    else:
        print("未获取到结果，请检查Hadoop作业是否完成")