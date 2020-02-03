#include <stdio.h>
#include <stdlib.h>

typedef struct LLNode {
  struct LLNode* next;
  struct LLNode* prev;
  void* value;
} LLNode;

typedef struct {
  LLNode* head;
  LLNode* tail;
  int length;
} LinkedList;

void ll_init(LinkedList* list) {
  list->head = NULL;
  list->tail = NULL;
  list->length = 0;
};

void ll_push(LinkedList* list, void* value) {
  // Initialize node
  LLNode* node = malloc(sizeof(LLNode));
  node->next = NULL;
  node->prev = NULL;
  node->value = value;

  // Add node

  // Check if we have an empty list
  if (list->length == 0) {
    // If empty list, set head and tail to new node
    list->head = node;
    list->tail = node;
    list->length += 1;
  } else {
    // Otherwise, push to the end
    list->tail->next = node;
    node->prev = list->tail;
    list->tail = node;
    list->length += 1;
  }
}

int ll_empty(LinkedList* list) { return list->length == 0; }

void* ll_pop(LinkedList* list) {
  if (ll_empty(list)) {
    return NULL;
  } else {
    // Grab tail
    LLNode* node = list->tail;
    list->tail = list->tail->prev;
    if (list->tail) {
      list->tail->next = NULL;
    } else {
      list->head = NULL;
    }
    void* value = node->value;
    free(node);
    list->length -= 1;
    return value;
  }
}

void ll_node_destroy(LLNode* node) {
  if (node) {
    ll_node_destroy(node->prev);
    ll_node_destroy(node->next);
    free(node);
  }
}

void ll_destroy(LinkedList* list) {
  ll_node_destroy(list->head);
  ll_node_destroy(list->tail);
}

int main(int argc, char** argv) {
  LinkedList* list = malloc(sizeof(LinkedList));
  ll_init(list);

  ll_push(list, 0);
  ll_push(list, 1);
  ll_push(list, 2);

  while (!ll_empty(list)) {
    int value = ll_pop(list);
    printf("Popped: %d\n", value);
  }

  ll_pop(list);

  ll_destroy(list);
}