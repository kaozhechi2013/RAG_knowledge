"""
Word文档图片清理工具使用示例
"""

import os
from document_processor import WordDocumentProcessor

def main():
    print("Word文档图片清理工具")
    print("="*50)

    # 获取用户输入的文档路径
    while True:
        doc_path = input("\n请输入要处理的文档文件夹路径（或输入'quit'退出）: ").strip()

        if doc_path.lower() == 'quit':
            print("退出程序")
            break

        if not doc_path:
            print("请输入有效路径")
            continue

        # 检查路径是否存在
        if not os.path.exists(doc_path):
            print(f"错误: 路径不存在 - {doc_path}")
            continue

        # 询问是否创建备份
        backup_choice = input("是否创建文件备份? (y/n，默认y): ").strip().lower()
        create_backup = backup_choice != 'n'

        # 创建处理器并处理文档
        try:
            processor = WordDocumentProcessor()

            if os.path.isfile(doc_path):
                # 处理单个文件
                if processor.is_word_document(doc_path):
                    print(f"\n开始处理文件: {doc_path}")
                    processor.process_single_file(doc_path, create_backup)
                else:
                    print("错误: 不是支持的Word文档格式")
            else:
                # 处理整个目录
                processor.process_directory(doc_path, create_backup)

        except KeyboardInterrupt:
            print("\n\n用户中断操作")
        except Exception as e:
            print(f"\n处理过程中出现错误: {e}")

        # 询问是否继续
        continue_choice = input("\n是否继续处理其他文档? (y/n): ").strip().lower()
        if continue_choice != 'y':
            break

    print("\n程序结束")

if __name__ == "__main__":
    main()
