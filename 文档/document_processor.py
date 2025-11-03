"""
Word文档图片清理工具
用于删除Word文档中的图片，只保留文字内容，以减小文件大小
支持批量处理文档文件夹中的所有Word文档
"""

import os
import zipfile
import shutil
import xml.etree.ElementTree as ET
from typing import Tuple
import argparse


class WordDocumentProcessor:
    """Word文档处理器，用于删除图片内容"""
    
    def __init__(self):
        self.processed_count = 0
        self.skipped_count = 0
        self.error_count = 0
        
    def get_file_size_mb(self, file_path: str) -> float:
        """获取文件大小（MB）"""
        size_bytes = os.path.getsize(file_path)
        return size_bytes / (1024 * 1024)
    
    def is_word_document(self, file_path: str) -> bool:
        """检查是否为Word文档"""
        return file_path.lower().endswith(('.docx', '.doc'))
    
    def backup_file(self, file_path: str) -> str:
        """创建文件备份"""
        backup_path = file_path + '.backup'
        shutil.copy2(file_path, backup_path)
        return backup_path
    
    def remove_images_from_docx(self, docx_path: str) -> bool:
        """从docx文件中删除图片"""
        try:
            # 创建临时目录
            temp_dir = docx_path + '_temp'
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            
            # 解压docx文件
            with zipfile.ZipFile(docx_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # 删除图片文件夹
            media_dir = os.path.join(temp_dir, 'word', 'media')
            if os.path.exists(media_dir):
                shutil.rmtree(media_dir)
                print(f"  已删除media文件夹: {media_dir}")
            
            # 处理document.xml文件，删除图片引用
            doc_xml_path = os.path.join(temp_dir, 'word', 'document.xml')
            if os.path.exists(doc_xml_path):
                self.remove_image_references_from_xml(doc_xml_path)
            
            # 处理关系文件，删除图片引用
            rels_dir = os.path.join(temp_dir, 'word', '_rels')
            if os.path.exists(rels_dir):
                for rel_file in os.listdir(rels_dir):
                    if rel_file.endswith('.rels'):
                        rel_path = os.path.join(rels_dir, rel_file)
                        self.remove_image_references_from_rels(rel_path)
            
            # 重新打包docx文件
            with zipfile.ZipFile(docx_path, 'w', zipfile.ZIP_DEFLATED) as zip_ref:
                for root, dirs, files in os.walk(temp_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        archive_path = os.path.relpath(file_path, temp_dir)
                        zip_ref.write(file_path, archive_path)
            
            # 清理临时目录
            shutil.rmtree(temp_dir)
            return True
            
        except Exception as e:
            print(f"  处理docx文件时出错: {e}")
            # 清理临时目录
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            return False
    
    def remove_image_references_from_xml(self, xml_path: str):
        """从XML文件中删除图片引用"""
        try:
            # 注册命名空间
            namespaces = {
                'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
                'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
                'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
                'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture'
            }
            
            for prefix, uri in namespaces.items():
                ET.register_namespace(prefix, uri)
            
            tree = ET.parse(xml_path)
            root = tree.getroot()
            
            # 找到并删除所有drawing元素（包含图片）
            drawings = root.findall('.//w:drawing', namespaces)
            for drawing in drawings:
                parent = root.find('.//*[w:drawing]', namespaces)
                if parent is not None:
                    parent.remove(drawing)
            
            # 找到并删除所有pict元素（旧版图片格式）
            picts = root.findall('.//w:pict', namespaces)
            for pict in picts:
                parent = root.find('.//*[w:pict]', namespaces)
                if parent is not None:
                    parent.remove(pict)
            
            # 保存修改后的XML
            tree.write(xml_path, encoding='utf-8', xml_declaration=True)
            
        except Exception as e:
            print(f"  处理XML文件时出错: {e}")
    
    def remove_image_references_from_rels(self, rels_path: str):
        """从关系文件中删除图片引用"""
        try:
            tree = ET.parse(rels_path)
            root = tree.getroot()
            
            # 找到并删除所有图片关系
            relationships = root.findall('.//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship')
            for rel in relationships:
                target = rel.get('Target', '')
                if 'media/' in target or target.endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                    root.remove(rel)
            
            # 保存修改后的关系文件
            tree.write(rels_path, encoding='utf-8', xml_declaration=True)
            
        except Exception as e:
            print(f"  处理关系文件时出错: {e}")
    
    def process_doc_file(self, doc_path: str) -> bool:
        """处理.doc文件（需要转换为.docx）"""
        print(f"  .doc文件需要手动转换为.docx格式: {doc_path}")
        print("  建议使用Microsoft Word打开并另存为.docx格式")
        return False
    
    def process_single_file(self, file_path: str, create_backup: bool = True) -> Tuple[bool, float, float]:
        """
        处理单个文件
        
        Returns:
            tuple: (成功标志, 原始大小MB, 处理后大小MB)
        """
        print(f"\n处理文件: {file_path}")
        
        # 检查文件大小
        original_size = self.get_file_size_mb(file_path)
        print(f"  原始大小: {original_size:.2f} MB")
        
        if original_size <= 15:
            print("  文件大小已小于15MB，跳过处理")
            self.skipped_count += 1
            return True, original_size, original_size
        
        # 创建备份
        backup_path = None
        if create_backup:
            try:
                backup_path = self.backup_file(file_path)
                print(f"  已创建备份: {backup_path}")
            except Exception as e:
                print(f"  创建备份失败: {e}")
                self.error_count += 1
                return False, original_size, original_size
        
        # 处理文件
        success = False
        if file_path.lower().endswith('.docx'):
            success = self.remove_images_from_docx(file_path)
        elif file_path.lower().endswith('.doc'):
            success = self.process_doc_file(file_path)
        
        if success:
            new_size = self.get_file_size_mb(file_path)
            print(f"  处理后大小: {new_size:.2f} MB")
            print(f"  减少了: {original_size - new_size:.2f} MB ({((original_size - new_size) / original_size * 100):.1f}%)")
            
            if new_size <= 15:
                print("  ✅ 文件大小现在符合15MB限制")
                self.processed_count += 1
            else:
                print("  ⚠️  文件大小仍超过15MB，可能需要进一步处理")
                self.processed_count += 1
            
            return True, original_size, new_size
        else:
            print("  处理失败")
            # 如果处理失败，恢复备份
            if backup_path and os.path.exists(backup_path):
                try:
                    shutil.move(backup_path, file_path)
                    print("  已恢复原始文件")
                except Exception as e:
                    print(f"  恢复文件失败: {e}")
            
            self.error_count += 1
            return False, original_size, original_size
    
    def process_directory(self, directory_path: str, create_backup: bool = True) -> None:
        """批量处理目录中的所有Word文档"""
        print(f"开始处理目录: {directory_path}")
        
        if not os.path.exists(directory_path):
            print(f"错误: 目录不存在 - {directory_path}")
            return
        
        # 获取所有Word文档
        word_files = []
        for root, dirs, files in os.walk(directory_path):
            for file in files:
                file_path = os.path.join(root, file)
                if self.is_word_document(file_path):
                    word_files.append(file_path)
        
        if not word_files:
            print("未找到Word文档")
            return
        
        print(f"找到 {len(word_files)} 个Word文档")
        
        total_original_size = 0.0
        total_new_size = 0.0
        
        # 处理每个文件
        for file_path in word_files:
            success, original_size, new_size = self.process_single_file(file_path, create_backup)
            total_original_size += original_size
            total_new_size += new_size
        
        # 显示统计信息
        print("\n" + "="*60)
        print("处理完成统计:")
        print(f"  总文件数: {len(word_files)}")
        print(f"  成功处理: {self.processed_count}")
        print(f"  跳过文件: {self.skipped_count}")
        print(f"  处理失败: {self.error_count}")
        print(f"  总大小减少: {total_original_size - total_new_size:.2f} MB")
        if total_original_size > 0:
            print(f"  压缩率: {((total_original_size - total_new_size) / total_original_size * 100):.1f}%")
        print("="*60)


def main():
    parser = argparse.ArgumentParser(description='Word文档图片清理工具')
    parser.add_argument('path', help='要处理的文件或目录路径')
    parser.add_argument('--no-backup', action='store_true', help='不创建备份文件')
    parser.add_argument('--silent', action='store_true', help='静默模式，减少输出')
    parser.add_argument('--remove-backup', action='store_true', help='处理成功后删除备份文件')
    
    args = parser.parse_args()
    
    processor = WordDocumentProcessor()
    
    try:
        if os.path.isfile(args.path):
            # 处理单个文件
            if processor.is_word_document(args.path):
                success, original_size, new_size = processor.process_single_file(
                    args.path, 
                    not args.no_backup
                )
                
                # 如果成功且需要删除备份
                if success and args.remove_backup and not args.no_backup:
                    backup_path = args.path + '.backup'
                    if os.path.exists(backup_path):
                        os.remove(backup_path)
                        if not args.silent:
                            print(f"  已删除备份文件: {backup_path}")
                
                # 返回退出码：0=成功，1=失败
                exit(0 if success else 1)
            else:
                print(f"错误: 不是支持的Word文档格式 - {args.path}")
                exit(1)
        elif os.path.isdir(args.path):
            # 处理目录
            processor.process_directory(args.path, not args.no_backup)
            exit(0)
        else:
            print(f"错误: 路径不存在 - {args.path}")
            exit(1)
    except Exception as e:
        print(f"错误: 处理过程中发生异常 - {str(e)}")
        exit(1)


if __name__ == "__main__":
    main()