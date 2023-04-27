import copy
from enum import Enum
from typing import List, Tuple
from django.utils.translation import ugettext as _
from django.utils.translation import get_language
from arches.app.utils.response import JSONResponse
from arches.app.models.models import PublishedGraph, Node
from arches.app.models.resource import Resource
from arches.app.datatypes.datatypes import DataTypeFactory
from docx import Document as _Document
from pptx import Presentation

class TemplateTagType(Enum):
    VALUE = 1,
    CONTEXT = 2
    END = 3,
    ROWEND = 4,
    IMAGE = 5

class TemplateTag(object):
    def __init__(self, raw: str, tag_type: TemplateTagType, attributes: dict = {}, optional_keys: dict = {}):
        self.type = tag_type
        self.attributes = attributes # context is relative to the r
        self.raw = raw
        self.value = None
        self.children:List[TemplateTag] = []
        self.end_tag = None
        self.optional_keys = optional_keys
        self.has_rows = False
        self.context_children_template = None


class ArchesTemplateEngine(object):
    def __init__(self, regex=None, ):
        self.regex = regex if regex else r'(<arches:(\w+)([\S\s]*)>)'


    def extract_tags(self, template) -> List[TemplateTag]: 
        tags = []
        tag_matches = self.extract_regex_matches(template)
        context:List[TemplateTag] = []
        tag_type = None

        for match in tag_matches:
            tag_match = match[0]
            attributes = {}

            try:
                optional_keys = match[1]
            except IndexError:
                optional_keys = None

            raw = tag_match[0]
            if tag_match[1] == "value":
                tag_type = TemplateTagType.VALUE
            if tag_match[1] == "image":
                tag_type = TemplateTagType.IMAGE
            elif tag_match[1] == "context":
                tag_type = TemplateTagType.CONTEXT
            elif tag_match[1] == "end":
                tag_type = TemplateTagType.END

            if len(tag_match) > 2:
                raw_attributes = tag_match[2].split()
                for attribute in raw_attributes:
                    split_attribute = attribute.split("=")
                    if len(split_attribute) == 2:
                        attributes[split_attribute[0]] = split_attribute[1].strip("\"'“”")
                if tag_type == None:
                    raise("Unsupported Tag - cannot proceed:" + tag_match[0])
            
            if(tag_type == TemplateTagType.CONTEXT):
                context_tag = TemplateTag(raw, tag_type, attributes, optional_keys)
                tags.append(context_tag)
                context.append(context_tag)
            elif(tag_type == TemplateTagType.END):
                context[-1].end_tag = TemplateTag(raw, tag_type, attributes, optional_keys)
                context.pop()
            elif(len(context) == 0):
                tags.append(TemplateTag(raw, tag_type, attributes, optional_keys))
            else: 
                context[-1].children.append(TemplateTag(raw, tag_type, attributes, optional_keys))
        return tags

    # the subclass needs to implement this method to hand back a tuple of unprocessed tag information
    def extract_regex_matches(self, template, regex) -> List[Tuple]:
        pass

    def normalize_dictionary_keys(self, dictionary):
        new_dictionary = {}
        for key, value in dictionary.items():
            # Normalize the key by removing leading/trailing whitespace and converting to lowercase
            norm_key = key.strip().replace(" ", "_").lower()
            # Store the value in the dictionary with the normalized key
            new_dictionary[norm_key] = value

        return {**dictionary, **new_dictionary}

    def traverse_dictionary(self, path, dictionary):
        path_parts = path.split("/")
        current_value = dictionary

        for part in path_parts:
            if(isinstance(current_value, dict)):
                current_value = self.normalize_dictionary_keys(current_value)
                current_value = current_value.get(part, None)
            elif(isinstance(current_value, List) and part.isnumeric()):
                try:
                    current_value = current_value[int(part)]
                except IndexError:
                    current_value = None # this is ok, allows us to continue writing to the template. 
        return current_value

    def get_tag_values(self, tags, context) -> List[TemplateTag]:
        extended_tags = []

        for tag in tags:
            if tag.type == TemplateTagType.VALUE or tag.type == TemplateTagType.IMAGE:
                path_value = tag.attributes.get("path", None)
                if path_value:
                    tag.value = self.traverse_dictionary(path_value, context)
                extended_tags.append(tag)
            elif tag.type == TemplateTagType.CONTEXT:
                path_value = tag.attributes.get("path", None)
                index_value = tag.attributes.get("index", None)
                if path_value:
                    new_context = self.traverse_dictionary(path_value, context)
                    if isinstance(new_context, List) and index_value:
                        self.get_tag_values(tag.children, new_context[int(index_value)])
                    elif isinstance(new_context, List):
                        tag.has_rows = True
                        tag.context_children_template = tag.children
                        tag.children = []
                        for item in new_context:
                            tag.children.extend(self.get_tag_values(copy.deepcopy(tag.context_children_template), item))
                            tag.children.append(TemplateTag('', TemplateTagType.ROWEND))
                    else:
                        self.get_tag_values(tag.children, new_context)
            elif tag.type == TemplateTagType.END:
                context.pop()

        return tags
        

    def create_file(self, tags, template):
        pass

    # Primary entrypoint; pass in a template to be formatted and the root resource with which to do it.  
    def document_replace(self, template, context):
        tags = self.extract_tags(template)

        expanded_tags = self.get_tag_values(tags, context)
        return self.create_file(expanded_tags, template)
    